// src/auth/dto/login.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDTO {
  @IsString()
  @IsNotEmpty({ message: '사용자 이름을 입력해주세요.' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
