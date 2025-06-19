import {
  Controller,
  Get,
  Post,
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { UserResponseDTO } from '../common/dto/user.response.dto';
import { JwtRefreshGuard } from 'src/common/guards/jwt-refresh.guard';

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

  // ✨ --- [Helper Method] 토큰을 HttpOnly 쿠키로 설정하는 중복 로직 --- ✨
  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    let cookieDomain: string | undefined = undefined;

    if (isProduction) {
      const frontendHost = new URL(this.frontendUrl).hostname;
      const domainParts = frontendHost.split('.');
      cookieDomain = domainParts.slice(-2).join('.');
    }

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 15, // 15분
      domain: cookieDomain,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      domain: cookieDomain,
    });
  }
  // --- 헬퍼 메소드 끝 ---

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 시작' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 콜백' })
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.handleGoogleLogin(req.user);

    // ✨ 헬퍼 메소드를 사용하여 쿠키 설정 로직을 호출합니다.
    this.setTokenCookies(res, accessToken, refreshToken);

    res.redirect(`${this.frontendUrl}/history`);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Access Token 재발급' })
  async refreshTokens(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.id;
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(userId);

    // ✨ 동일한 헬퍼 메소드를 사용하여 쿠키 설정 로직을 호출합니다.
    this.setTokenCookies(res, accessToken, refreshToken);

    return { message: 'Tokens refreshed successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회 (JWT 인증 필요)' })
  getProfile(@Req() req: Request): UserResponseDTO {
    return req.user as UserResponseDTO;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const userId = req.user.id;
    await this.authService.removeRefreshToken(userId);

    // ✨ 로그아웃 시 쿠키를 삭제합니다.
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
