// src/auth/session.serializer.ts
import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity'; // User 엔티티 경로 수정
import { InjectRepository } from '@nestjs/typeorm'; // userService 대신 직접 접근 예시
import { Repository } from 'typeorm';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    // AuthService에 findById 같은 메서드를 만들거나, UserRepository를 직접 주입할 수 있습니다.
    // 여기서는 UserRepository를 직접 주입하는 예시를 보여드립니다.
    // AuthService에 메서드를 만들었다면 해당 서비스를 주입하세요.
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  serializeUser(
    user: Omit<User, 'password'>,
    done: (err: Error | null, userId?: number) => void,
  ): void {
    done(null, user.id); // 사용자 ID를 세션에 저장
  }

  async deserializeUser(
    userId: number,
    done: (err: Error | null, user?: Omit<User, 'password'> | null) => void,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userInfo } = user;
        done(null, userInfo); // 비밀번호 제외하고 사용자 정보 복원
      } else {
        done(null, null);
      }
    } catch (error) {
      done(error, null);
    }
  }
}
