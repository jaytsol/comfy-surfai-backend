import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  StrategyOptions,
  VerifyCallback,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${configService.get('API_BASE_URL')}/auth/google/callback`,
      scope: ['email', 'profile'],
      accessType: 'offline',
      prompt: 'consent', // 최초 로그인 시 동의 화면을 확실히 표시
    } as StrategyOptions);
  }

  // Google 인증 성공 후 호출되는 함수
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const googleUser = {
      googleId: id,
      email: emails[0].value,
      displayName: name.givenName,
      avatarUrl: photos[0].value,
    };

    // DB에서 이 Google 유저를 찾거나, 없으면 새로 생성
    const user = await this.authService.findOrCreateGoogleUser({
      user: googleUser,
    });

    const payload = {
      user,
      accessToken,
    };

    done(null, payload);
  }
}
