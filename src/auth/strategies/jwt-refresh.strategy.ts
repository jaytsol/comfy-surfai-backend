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
      // JWT 시크릿 키가 설정되지 않은 것은 심각한 설정 오류이므로,
      // 서버가 시작되지 않도록 에러를 발생시킵니다.
      throw new Error(
        'FATAL ERROR: JWT_REFRESH_SECRET environment variable is not set.',
      );
    }
    super({
      // ✨ refresh_token 쿠키에서 토큰을 추출합니다.
      jwtFromRequest: (req: Request) => {
        if (req && req.cookies) {
          return req.cookies['refresh_token'];
        }
        return null;
      },
      ignoreExpiration: false,
      // ✨ Refresh Token 검증에는 별도의 시크릿 키를 사용합니다.
      secretOrKey: jwtRefreshSecret,
    });
  }

  // Refresh Token 검증 성공 후 호출됨
  validate(payload: any) {
    // payload에는 Access Token과 동일한 정보가 담겨 있습니다.
    // 여기서는 req.user에 id만 담아주면 충분합니다.
    return { id: payload.sub };
  }
}
