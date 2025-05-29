// src/auth/session.serializer.ts
import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  serializeUser(
    user: Omit<User, 'password'>,
    done: (err: Error | null, userId?: number) => void,
  ): void {
    if (!user || typeof user.id === 'undefined') {
      done(
        new Error('Invalid user object for session serialization.'),
        undefined,
      );
      return;
    }
    done(null, user.id);
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
