import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// src/common/dto/create-user.dto.ts
export class CreateUserDTO {
  @ApiProperty({
    description: '사용자 이름 (3자 이상)',
    example: 'newuser123',
    minLength: 3,
    type: 'string',
  })
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '사용자 이름을 입력해주세요.' })
  username: string;

  @ApiProperty({
    description: '비밀번호 (6자 이상)',
    example: 'password123!',
    minLength: 6,
    type: 'string',
    format: 'password',
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;
}
