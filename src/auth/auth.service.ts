import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Role } from 'src/common/enums/role.enum';

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
  ) {
    // 환경 변수에서 관리자 이메일 목록을 가져와 배열로 만듭니다.
    const adminEmailString = this.configService.get<string>('ADMIN_EMAILS', '');
    this.adminEmails = adminEmailString.split(',').map((email) => email.trim());
  }

  /**
   * Google 프로필 정보로 사용자를 찾거나, 없으면 새로 생성합니다.
   * @param profile Google로부터 받은 사용자 프로필 정보
   * @param refreshToken (선택) Google로부터 받은 리프레시 토큰
   * @returns 우리 시스템의 User 엔티티
   */
  async findOrCreateGoogleUser(
    profile: GoogleProfilePayload,
    refreshToken?: string,
  ): Promise<User> {
    // 1. googleId를 기준으로 기존 사용자가 있는지 확인합니다.
    let user = await this.userRepository.findOne({
      where: { googleId: profile.googleId },
    });

    if (user) {
      // 2. 이미 존재하는 사용자라면, 이름이나 프로필 사진이 변경되었을 수 있으니 업데이트합니다.
      user.displayName = profile.displayName;
      user.imageUrl = profile.avatarUrl;
      // TODO: 리프레시 토큰이 새로 발급되었다면 DB에 업데이트하는 로직 (선택 사항)
      // if (refreshToken) { user.currentHashedRefreshToken = await hash(refreshToken) }

      console.log(`[AuthService] Found existing user: ${user.email}`);
      return this.userRepository.save(user);
    }

    // 3. 존재하지 않는 사용자라면, 이메일을 기준으로 다시 한번 확인합니다.
    // (예: 이전에 이메일/비밀번호로 가입했다가, 나중에 Google로 로그인하는 경우)
    user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (user) {
      // 4. 이메일이 같은 사용자가 있다면, 해당 계정에 googleId를 연결해줍니다.
      user.googleId = profile.googleId;
      user.imageUrl = user.imageUrl || profile.avatarUrl; // 기존 프로필 사진이 없으면 구글 것으로 설정
      // ...
      console.log(
        `[AuthService] Linking Google account to existing user: ${user.email}`,
      );
      return this.userRepository.save(user);
    }

    // 5. 완전히 새로운 사용자라면, 새로 생성합니다.
    const newUser = this.userRepository.create({
      googleId: profile.googleId,
      email: profile.email,
      displayName: profile.displayName || profile.email, // 이름이 없는 경우 이메일을 이름으로 사용
      imageUrl: profile.avatarUrl,
      // ✨ 관리자 이메일 목록에 포함되어 있는지 확인하여 역할(role) 부여
      role: this.adminEmails.includes(profile.email) ? Role.Admin : Role.User,
    });

    console.log(
      `[AuthService] Creating new user: ${newUser.email} with role: ${newUser.role}`,
    );

    const savedUser = await this.userRepository.save(newUser);

    if (refreshToken) {
      // ✨ 신규 유저 생성 시에도 리프레시 토큰 저장
      await this.setCurrentRefreshToken(refreshToken, savedUser.id);
    }

    return savedUser;
  }

  // ✨ --- Refresh Token 관련 메소드들 추가 --- ✨

  /**
   * 사용자의 Refresh Token을 암호화하여 DB에 저장합니다.
   */
  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    // TODO: 프로덕션을 위해서는 bcrypt로 해싱(hashing)하여 저장해야 합니다.
    const currentHashedRefreshToken = refreshToken; // 지금은 간단하게 텍스트로 저장
    await this.userRepository.update(userId, { currentHashedRefreshToken });
  }

  /**
   * Refresh Token으로 새로운 Access Token 발급받기 (아직 미사용, 향후 구현용)
   */
  async getNewAccessToken(refreshToken: string) {
    // 이 로직은 나중에 Access Token이 만료되었을 때 호출됩니다.
    // Google의 토큰 엔드포인트로 요청을 보내 새로운 액세스 토큰을 받아옵니다.
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: this.configService.get('GOOGLE_CLIENT_ID'),
      client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    return data.access_token;
  }
}
