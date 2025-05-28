// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth') // 기본 경로 설정 (예: /auth/register)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register') // POST /auth/register 엔드포인트
  @HttpCode(HttpStatus.CREATED) // 성공 시 201 Created 반환
  async register(@Body() createUserDto: CreateUserDto): Promise<any> {
    // 반환 타입은 User 또는 DTO로 명확히 하는 것이 좋음
    const user = await this.authService.registerUser(createUserDto);
    return { message: '사용자가 성공적으로 등록되었습니다.', user };
  }
}
