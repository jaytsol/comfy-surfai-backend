import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { User } from 'src/common/entities/user.entity';
import { Role } from 'src/common/enums/role.enum';

// JWT 페이로드의 타입을 명확하게 정의합니다.
interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

// 쿠키에서 'access_token'을 추출하는 헬퍼 함수
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
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

  /**
   * Passport가 JWT의 서명과 만료 시간을 검증한 후, 성공 시 이 메소드를 호출합니다.
   * 토큰의 payload를 받아, 실제 사용자가 DB에 존재하는지 확인하고
   * 완전한 사용자 객체를 반환하여 req.user에 첨부합니다.
   * @param payload JWT에 담겨있던 페이로드 ({ sub, email, role })
   * @returns 데이터베이스에서 조회한 User 엔티티
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.authService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or has been deleted.');
    }
    return user;
  }
}
