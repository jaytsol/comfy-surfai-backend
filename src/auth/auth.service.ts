// src/auth/auth.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { CreateUserDTO } from '../common/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async registerUser(
    createUserDto: CreateUserDTO,
  ): Promise<Omit<User, 'password'>> {
    const { username, password } = createUserDto;

    const existingUser = await this.usersRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 사용자 이름입니다.');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = this.usersRepository.create({
      username,
      password: hashedPassword,
      role: 'user',
    });

    try {
      await this.usersRepository.save(newUser);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = newUser;
      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new ConflictException(
        '사용자 등록에 실패했습니다. 관리자에게 문의하세요.',
      );
    }
  }

  async validateUser(
    username: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersRepository.findOne({ where: { username } });

    if (!user) {
      return null;
    }

    const isPasswordMatching = bcrypt.compareSync(pass, user.password);

    if (isPasswordMatching) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    } else {
      return null;
    }
  }
}
