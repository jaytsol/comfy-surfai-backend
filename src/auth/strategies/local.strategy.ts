// src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../entities/user.entity'; // User 엔티티 경로 수정 (현재 파일 기준)

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username', // DTO의 username 필드와 일치
    });
  }

  async validate(
    username: string,
    password_input: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.authService.validateUser(username, password_input);
    if (!user) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 일치하지 않습니다.',
      );
    }
    // validateUser에서 이미 password 필드를 제외하고 반환하므로 그대로 사용 가능
    return user;
  }
}
