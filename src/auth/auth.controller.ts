// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request, // Express의 Request 객체를 사용하기 위해
  Get,
  Res, // Express의 Response 객체 사용
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response as ExpressResponse } from 'express'; // 타입 명확성을 위해 alias 사용
import { AuthenticatedGuard } from 'src/guards/authenticated.guard';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { CreateUserDTO } from 'src/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDTO) {
    // 반환 타입 명시 권장
    const user = await this.authService.registerUser(createUserDto);
    return {
      message: '사용자가 성공적으로 등록되었습니다.',
      userId: user.id,
      username: user.username,
    };
  }

  @UseGuards(LocalAuthGuard) // LocalStrategy 실행
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // async login(@Request() req, @Body() loginDto: LoginDto) { // loginDto는 LocalAuthGuard가 사용하므로 명시적 사용은 X
  login(@Request() req) {
    // LocalAuthGuard -> LocalStrategy.validate -> Passport가 req.user에 사용자 정보 주입 및 세션 생성
    return { message: '로그인 성공', user: req.user };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req) {
    // AuthenticatedGuard를 통과하면 req.user는 항상 존재
    return { message: '프로필 정보 조회 성공', user: req.user };
  }

  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<{ message: string }> {
    return new Promise((resolve, reject) => {
      req.logout((logoutErr: any) => {
        if (logoutErr) {
          console.error('Passport logout error:', logoutErr);
          return reject(
            new UnauthorizedException('로그아웃 처리 중 오류 발생'),
          );
        }
        req.session.destroy((sessionErr: any) => {
          if (sessionErr) {
            console.error('Session destruction error:', sessionErr);
            // 세션 파괴 실패에 대한 처리 (예: 로깅만 하고 성공으로 간주)
          }
          res.clearCookie('connect.sid'); // 세션 쿠키 이름 확인 필요
          resolve({ message: '성공적으로 로그아웃되었습니다.' });
        });
      });
    });
  }
}
