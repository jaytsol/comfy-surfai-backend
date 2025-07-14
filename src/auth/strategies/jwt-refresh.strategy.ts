import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    const jwtRefreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!jwtRefreshSecret) {
      throw new Error(
        'FATAL ERROR: JWT_REFRESH_SECRET environment variable is not set.',
      );
    }
    super({
      jwtFromRequest: (req: Request) => {
        if (req && req.cookies) {
          return req.cookies['refresh_token'];
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: jwtRefreshSecret,
    });
  }

  validate(payload: any) {
    return { id: payload.sub };
  }
}
