import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/common/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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
