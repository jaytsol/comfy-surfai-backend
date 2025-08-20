import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialConnection } from './entities/social-connection.entity';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { GoogleYouTubeStrategy } from './strategies/google-youtube.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { GoogleConnectGuard } from './guards/google-connect.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialConnection]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '5m' }, // State token expires in 5 minutes
      }),
    }),
  ],
  controllers: [SocialController],
  providers: [SocialService, GoogleYouTubeStrategy, GoogleConnectGuard],
})
export class SocialModule {}
