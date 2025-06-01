// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response as ExpressResponse } from 'express';
import { AuthenticatedGuard } from 'src/common/guards/authenticated.guard';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';
import { CreateUserDTO } from 'src/common/dto/create-user.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDTO } from 'src/common/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '신규 사용자 등록' })
  @ApiBody({ type: CreateUserDTO, description: '사용자 등록을 위한 정보' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '사용자 등록 성공.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 입력 값입니다.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 사용 중인 사용자 이름입니다.',
  })
  async register(@Body() createUserDTO: CreateUserDTO) {
    const user = await this.authService.registerUser(createUserDTO);
    return {
      message: '사용자가 성공적으로 등록되었습니다.',
      userId: user.id,
      username: user.username,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 로그인' })
  @ApiBody({
    type: LoginDTO,
    description: '로그인을 위한 사용자 자격 증명',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '로그인 성공. 세션 쿠키가 발급됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '잘못된 자격 증명입니다.',
  })
  login(@Request() req) {
    return { message: '로그인 성공', user: req.user };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 프로필 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '프로필 정보 조회 성공' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '로그인이 필요합니다.',
  })
  getProfile(@Request() req) {
    return { message: '프로필 정보 조회 성공', user: req.user };
  }

  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 로그아웃' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '성공적으로 로그아웃되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '로그인이 필요합니다.',
  })
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
          }
          res.clearCookie('connect.sid');
          resolve({ message: '성공적으로 로그아웃되었습니다.' });
        });
      });
    });
  }
}
