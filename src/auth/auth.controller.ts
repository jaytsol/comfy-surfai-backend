import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';
import { JwtRefreshGuard } from 'src/common/guards/jwt-refresh.guard';
import { Request, Response, CookieOptions } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/common/dto/create-user.dto';
import { UserResponseDTO } from 'src/common/dto/user.response.dto';
import { LoginResponseDTO } from 'src/common/dto/login-response.dto';
import { LoginDTO } from 'src/common/dto/login.dto';

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

  private getCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    let domain: string | undefined = undefined;

    if (isProduction) {
      const rootDomain = this.configService.get<string>('ROOT_DOMAIN');
      if (rootDomain && rootDomain !== 'localhost') {
        domain = rootDomain;
      }
    }

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      domain: domain,
    };
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const options = this.getCookieOptions();
    res.cookie('access_token', accessToken, {
      ...options,
      maxAge: 1000 * 60 * 15, // 15분
    });
    res.cookie('refresh_token', refreshToken, {
      ...options,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    });
  }

  @Post('register')
  @ApiOperation({ summary: '일반 회원가입' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: UserResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (예: 비밀번호 길이 부족)',
  })
  @ApiResponse({ status: 409, description: '이미 사용 중인 이메일 (Conflict)' })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDTO> {
    const user = await this.authService.register(createUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, currentHashedRefreshToken, ...result } = user;
    return result as UserResponseDTO;
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '일반 로그인' })
  @ApiBody({ type: LoginDTO })
  @ApiResponse({
    status: 200,
    description: '로그인 성공, 쿠키에 토큰 설정됨',
    type: LoginResponseDTO,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (이메일 또는 비밀번호 불일치)',
  })
  async login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const loginResult = await this.authService.login(req.user);
    this.setTokenCookies(
      res,
      loginResult.accessToken,
      loginResult.refreshToken,
    );
    return loginResult;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google 로그인 시작',
    description: '사용자를 Google 로그인 페이지로 리디렉션합니다.',
  })
  @ApiResponse({ status: 302, description: 'Google 인증 페이지로 리디렉션' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google 로그인 콜백',
    description: '인증 완료 후 프론트엔드로 리디렉션됩니다.',
  })
  @ApiResponse({
    status: 302,
    description: '인증 성공 시 프론트엔드 페이지로 리디렉션',
  })
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );
    this.setTokenCookies(res, accessToken, refreshToken);
    res.redirect(`${this.frontendUrl}/history`);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('refresh-token') // Refresh Token 인증을 별도로 명시 (main.ts에서 Swagger 설정 추가 필요)
  @ApiOperation({ summary: 'Access Token 재발급' })
  @ApiResponse({ status: 200, description: '새로운 토큰 발급 성공' })
  @ApiResponse({ status: 401, description: 'Refresh Token 만료 또는 무효' })
  async refreshTokens(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      req.user.id,
    );
    this.setTokenCookies(res, accessToken, refreshToken);
    return { message: 'Tokens refreshed successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회 (Access Token 필요)' })
  @ApiResponse({
    status: 200,
    description: '성공적으로 사용자 정보를 반환합니다.',
    type: UserResponseDTO,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getProfile(@Req() req: any): UserResponseDTO {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃 (Access Token 필요)' })
  @ApiResponse({ status: 204, description: '성공적으로 로그아웃 처리됨' })
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.removeRefreshToken(req.user.id);
    const options = this.getCookieOptions();
    res.clearCookie('access_token', options);
    res.clearCookie('refresh_token', options);
  }
}
