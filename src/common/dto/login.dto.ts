import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * 일반 로그인 API(/auth/login)가 클라이언트로부터 받는 요청 본문(body)의
 * 구조를 정의하고 유효성을 검사하는 DTO입니다.
 */
export class LoginDTO {
  @ApiProperty({
    description: '로그인할 사용자의 이메일 주소',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({
    description: '사용자의 비밀번호',
    example: 'password123!',
  })
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
