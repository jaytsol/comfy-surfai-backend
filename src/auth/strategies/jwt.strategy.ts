import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// ✨ 쿠키에서 JWT를 추출하기 위한 함수
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      // JWT 시크릿 키가 설정되지 않은 것은 심각한 설정 오류이므로,
      // 서버가 시작되지 않도록 에러를 발생시킵니다.
      throw new Error(
        'FATAL ERROR: JWT_SECRET environment variable is not set.',
      );
    }

    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
