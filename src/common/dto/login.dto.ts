// src/common/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDTO {
  @ApiProperty({
    description: '로그인 사용자 이름',
    example: 'testuser',
  })
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '사용자 이름을 입력해주세요.' })
  username: string;

  @ApiProperty({
    description: '로그인 비밀번호',
    example: 'password123',
    type: 'string',
    format: 'password',
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
