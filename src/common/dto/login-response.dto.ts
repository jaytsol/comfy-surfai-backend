import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDTO } from '../dto/user.response.dto'; // User 정보 DTO

export class LoginResponseDTO {
  @ApiProperty({
    description: '인증에 사용될 Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Access Token 재발급에 사용될 Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: '로그인한 사용자 정보',
    type: UserResponseDTO, // 사용자 정보 구조를 명시
  })
  user: UserResponseDTO;
}
