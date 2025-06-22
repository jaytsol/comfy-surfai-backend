import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/common/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/common/dto/create-user.dto';

interface GoogleProfilePayload {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

@Injectable()
export class AuthService {
  private readonly adminEmails: string[];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    const adminEmailString = this.configService.get<string>('ADMIN_EMAILS', '');
    this.adminEmails = adminEmailString.split(',').map((email) => email.trim());
  }

  /**
   * (신규) 일반 회원가입
   */
  async register(createUserInput: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserInput.email },
    });
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserInput.password,
      saltRounds,
    );

    const newUser = this.userRepository.create({
      ...createUserInput,
      password: hashedPassword,
      role: this.adminEmails.includes(createUserInput.email)
        ? Role.Admin
        : Role.User,
    });
    return this.userRepository.save(newUser);
  }

  /**
   * (신규) 이메일/비밀번호 사용자 검증
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'displayName'], // password를 명시적으로 포함
    });
    if (user) {
      // ✨ 1. 비밀번호 비교 결과를 별도의 변수에 먼저 할당합니다.
      const isPasswordMatching = await bcrypt.compare(password, user.password);

      // ✨ 2. if 문에서는 이 변수를 사용하여 조건을 확인합니다.
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      if (isPasswordMatching) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }

    // 유저가 없거나, 비밀번호가 일치하지 않으면 null 반환
    return null;
  }

  /**
   * Google 로그인/가입 성공 후, 토큰을 발급하고 로그인 처리를 총괄합니다.
   * @param profile Google로부터 받은 사용자 프로필 정보
   * @param googleRefreshToken (선택) Google로부터 받은 리프레시 토큰
   * @returns { accessToken, refreshToken, user }
   */
  async handleGoogleLogin(
    profile: GoogleProfilePayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    googleRefreshToken?: string, // Google의 리프레시 토큰은 나중에 Google API를 직접 호출할 때 사용
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // 1. 우리 DB에서 사용자를 찾거나 새로 만듭니다.
    const user = await this.findOrCreateGoogleUser(profile);

    // 2. 우리 서비스의 Access Token과 Refresh Token을 생성합니다.
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
    });

    // 3. 생성된 Refresh Token을 해싱하여 DB에 저장합니다.
    await this.setCurrentRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Google 프로필 정보로 사용자를 찾거나, 없으면 새로 생성합니다.
   */
  async findOrCreateGoogleUser(profile: GoogleProfilePayload): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { googleId: profile.googleId },
    });

    if (user) {
      user.displayName = profile.displayName;
      user.imageUrl = profile.avatarUrl;
      return this.userRepository.save(user);
    }

    // 이메일로 기존 계정 확인 및 연동
    user = await this.userRepository.findOne({
      where: { email: profile.email },
    });
    if (user) {
      user.googleId = profile.googleId;
      user.imageUrl = user.imageUrl || profile.avatarUrl;
      return this.userRepository.save(user);
    }

    // 신규 사용자 생성
    const newUser = this.userRepository.create({
      googleId: profile.googleId,
      email: profile.email,
      displayName: profile.displayName || profile.email,
      imageUrl: profile.avatarUrl,
      role: this.adminEmails.includes(profile.email) ? Role.Admin : Role.User,
    });
    return this.userRepository.save(newUser);
  }

  /**
   * 새로운 Access Token과 Refresh Token을 발급합니다.
   * @param userId 토큰을 발급할 사용자의 ID
   */
  async refreshTokens(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');

    // ✨ login 메소드를 재사용하여 새로운 토큰들을 생성하고 DB에 저장합니다.
    const tokens = await this.handleGoogleLogin(user);
    return tokens;
  }

  /**
   * 사용자의 Refresh Token을 해싱하여 DB에 저장합니다.
   */
  async setCurrentRefreshToken(
    refreshToken: string,
    userId: number,
  ): Promise<void> {
    const saltRounds = 10;
    const currentHashedRefreshToken = await bcrypt.hash(
      refreshToken,
      saltRounds,
    );
    await this.userRepository.update(userId, { currentHashedRefreshToken });
  }

  /**
   * 로그아웃 시, 사용자의 Refresh Token을 DB에서 제거(무효화)합니다.
   */
  async removeRefreshToken(userId: number): Promise<any> {
    return this.userRepository.update(userId, {
      currentHashedRefreshToken: null,
    });
  }
}
