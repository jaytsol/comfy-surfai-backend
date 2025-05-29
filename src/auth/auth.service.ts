// src/auth/auth.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async registerUser(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const { username, password } = createUserDto;

    // 1. 사용자 이름 중복 확인
    const existingUser = await this.usersRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 사용자 이름입니다.');
    }

    // 2. 비밀번호 해싱
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. 새 사용자 엔티티 생성
    const newUser = this.usersRepository.create({
      username,
      password: hashedPassword,
      role: 'user', // 기본 역할 설정
    });

    // 4. 데이터베이스에 저장
    try {
      await this.usersRepository.save(newUser);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = newUser;
      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // 데이터베이스 저장 중 오류 발생 시
      throw new ConflictException(
        '사용자 등록에 실패했습니다. 관리자에게 문의하세요.',
      );
    }
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (user && bcrypt.compareSync(pass, user.password)) {
      // 비밀번호는 반환하지 않음
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
