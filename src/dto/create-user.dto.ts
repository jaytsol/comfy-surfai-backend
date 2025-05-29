import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// src/auth/dto/create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '사용자 이름은 필수입니다.' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;
}
