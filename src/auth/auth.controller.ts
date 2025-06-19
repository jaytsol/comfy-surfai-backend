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
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
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

  // ✨ 1. Google 로그인 시작 API
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 시작' })
  // 이 핸들러는 실제로 실행되지 않습니다.
  // GoogleAuthGuard가 사용자를 즉시 Google 로그인 페이지로 리디렉션합니다.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() req: Request) {}

  // ✨ 2. Google 로그인 콜백 처리 API
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 콜백' })
  // Google에서 성공적으로 돌아오면, GoogleStrategy의 validate 메소드가 실행된 후 이 핸들러가 호출됩니다.
  // 이때 req.user에는 validate에서 반환한 사용자 정보가 담겨 있습니다.
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // 로그인이 성공적으로 완료되었으므로, 프론트엔드의 특정 페이지로 리디렉션합니다.
    // 예: 바로 히스토리 페이지나 대시보드로 보냅니다.
    res.redirect(`${this.frontendUrl}/history`);
  }

  // ✨ 3. 로그인 상태 확인 API
  @Get('profile')
  @UseGuards(AuthenticatedGuard)
  @ApiOperation({ summary: '현재 로그인된 사용자 정보 조회' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  getProfile(@Req() req: Request) {
    // req.user는 세션에서 복원된 사용자 정보입니다.
    // password와 같은 민감한 정보는 제외하고 반환해야 합니다. (현재 User 엔티티에는 password가 없으므로 안전합니다.)
    return req.user;
  }

  // ✨ 4. 로그아웃 API
  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '로그아웃' })
  @ApiCookieAuth()
  @ApiResponse({ status: 204, description: '성공적으로 로그아웃됨' })
  logout(@Req() req: Request, @Res() res: Response): void {
    req.logout((err) => {
      if (err) {
        // 에러 처리
        return res.status(500).json({ message: 'Logout failed.' });
      }
      // 세션을 파기하고 쿠키를 지웁니다.
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.status(HttpStatus.NO_CONTENT).send();
      });
    });
  }
}
