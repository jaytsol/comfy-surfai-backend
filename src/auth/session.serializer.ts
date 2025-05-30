// src/auth/session.serializer.ts
import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { User } from '../common/entities/user.entity';
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
        done(null, userInfo);
      } else {
        done(null, null);
      }
    } catch (error) {
      done(error, null);
    }
  }
}
