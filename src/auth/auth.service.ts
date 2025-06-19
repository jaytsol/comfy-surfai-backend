import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  imageUrl?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService, // ✨ ConfigService 주입
  ) {}

  async findOrCreateGoogleUser(
    profile: GoogleProfile,
    refreshToken?: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { googleId: profile.googleId },
    });

    if (user) {
      if (refreshToken) {
        // ✨ 리프레시 토큰이 새로 발급되었다면 DB에 업데이트
        await this.setCurrentRefreshToken(refreshToken, user.id);
      }
      return user;
    }

    const newUser = this.userRepository.create({
      googleId: profile.googleId,
      email: profile.email,
      displayName: profile.displayName || profile.email,
      imageUrl: profile.imageUrl,
    });

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
