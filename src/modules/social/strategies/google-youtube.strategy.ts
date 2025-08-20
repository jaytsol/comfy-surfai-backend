import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleYouTubeStrategy extends PassportStrategy(
  Strategy,
  'google-youtube',
) {
  constructor(private readonly configService: ConfigService) {
    const callbackURL = configService.get('GOOGLE_YOUTUBE_CALLBACK_URL');
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: callbackURL,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/youtube.upload',
      ],
      accessType: 'offline', // To get a refresh token
      prompt: 'consent', // To ensure a refresh token is provided every time
      passReqToCallback: true,
    } as any);
  }

  validate(
    req: any, // request object to access state
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
