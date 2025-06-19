import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt'; // ✨ JWT 모듈 임포트
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy'; // ✨ 새로 만들 JwtStrategy
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy'; // ✨ 새로 만들 JwtRefreshStrategy

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    // ✨ JWT 모듈을 비동기적으로 설정
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'), // .env 파일에 추가해야 할 비밀 키
        signOptions: {
          expiresIn: '15m', // Access Token 유효 기간
        },
      }),
    }),
  ],
  controllers: [AuthController],
  // ✨ GoogleStrategy와 함께 JwtStrategy를 providers에 추가
  providers: [AuthService, GoogleStrategy, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
