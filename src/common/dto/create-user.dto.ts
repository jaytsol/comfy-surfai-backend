import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * 일반 회원가입 시 클라이언트로부터 받는 데이터의 구조를 정의하고 유효성을 검사하는 DTO입니다.
 */
export class CreateUserDto {
  @ApiProperty({
    description: '사용자의 이메일 주소 (로그인 ID로 사용)',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({
    description: '사용자의 비밀번호 (최소 8자 이상)',
    example: 'password123!',
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;

  @ApiProperty({
    description: '사용자의 표시 이름 (닉네임)',
    example: '홍길동',
    maxLength: 50,
    required: true,
  })
  @IsString()
  @MaxLength(50)
  @IsNotEmpty({ message: '표시 이름을 입력해주세요.' })
  displayName: string;
}
