import {
  Controller,
  Get,
  Post, // Post는 이제 로그아웃에만 사용됩니다.
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4000';
  }

  // 1. Google 로그인 시작 API
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 시작' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() req: Request) {
    // GoogleAuthGuard가 Google 로그인 페이지로 리디렉션합니다.
  }

  // 2. Google 로그인 콜백 처리 API
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 콜백' })
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    // ✨ req.user에는 GoogleStrategy의 validate에서 반환한 payload가 담겨 있습니다.
    const { accessToken, refreshToken } =
      await this.authService.handleGoogleLogin(req.user);

    // ✨ 생성된 토큰들을 쿼리 파라미터로 담아 프론트엔드로 리디렉션
    res.redirect(
      `${this.frontendUrl}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`,
    );
  }

  // 3. 로그인 상태 확인 API
  @Get('profile')
  @UseGuards(JwtAuthGuard) // ✨ JwtAuthGuard만 사용합니다.
  @ApiBearerAuth() // ✨ Swagger에서 JWT 인증이 필요함을 명시
  @ApiOperation({ summary: '현재 로그인된 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  getProfile(@Req() req: Request) {
    // req.user는 이제 JwtStrategy의 validate에서 반환한 payload가 됩니다.
    return req.user;
  }

  // 4. 로그아웃 API (Refresh Token 무효화)
  @Post('logout')
  @UseGuards(JwtAuthGuard) // ✨ JwtAuthGuard만 사용합니다.
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '로그아웃' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: '성공적으로 로그아웃됨' })
  async logout(@Req() req: any): Promise<void> {
    // ✨ DB에 저장된 Refresh Token을 무효화/삭제하는 로직을 호출합니다.
    const userId = req.user.id;
    await this.authService.removeRefreshToken(userId);
  }
}
