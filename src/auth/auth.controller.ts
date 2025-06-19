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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LoginResponseDTO } from '../common/dto/login-response.dto'; // ✨ DTO 임포트
import { UserResponseDTO } from '../common/dto/user.response.dto'; // ✨ DTO 임포트

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

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google 로그인 시작',
    description: '사용자를 Google 로그인 페이지로 리디렉션합니다.',
  })
  @ApiResponse({
    status: 302,
    description: 'Google 인증 페이지로 리디렉션됩니다.',
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google 로그인 콜백',
    description: 'Google 인증 성공 후 토큰과 함께 프론트엔드로 리디렉션됩니다.',
  })
  @ApiResponse({
    status: 302,
    description: 'JWT 토큰을 포함하여 프론트엔드의 콜백 URL로 리디렉션됩니다.',
  })
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.handleGoogleLogin(req.user);
    // 참고: 실제 응답은 리디렉션이지만, Swagger에서는 이 정보를 직접 테스트하기 어렵습니다.
    // 프론트엔드 URL에 토큰을 담아 보내는 것을 문서에 명시하는 것이 중요합니다.
    res.redirect(
      `${this.frontendUrl}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // ✨ Swagger UI 우측 상단에 자물쇠 아이콘(Authorize)이 생깁니다.
  @ApiOperation({ summary: '내 정보 조회 (JWT 인증 필요)' })
  @ApiResponse({
    status: 200,
    description: '성공적으로 사용자 정보를 반환합니다.',
    type: UserResponseDTO,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (토큰 없음, 만료, 또는 유효하지 않음)',
  })
  getProfile(@Req() req: Request): UserResponseDTO {
    // req.user에는 JwtStrategy의 validate에서 반환한 { id, email, role }이 담겨있습니다.
    // 실제로는 user 전체 객체를 반환하도록 auth.service.ts의 login 로직을 수정하는 것이 좋습니다.
    return req.user as UserResponseDTO;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃 (JWT 인증 필요)' })
  @ApiResponse({
    status: 204,
    description: '성공적으로 로그아웃 처리됨 (Refresh Token 무효화)',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async logout(@Req() req: any): Promise<void> {
    const userId = req.user.id;
    await this.authService.removeRefreshToken(userId);
  }
}
