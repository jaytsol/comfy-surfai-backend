import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialConnection } from './entities/social-connection.entity';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { GoogleYouTubeStrategy } from './strategies/google-youtube.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [TypeOrmModule.forFeature([SocialConnection]), PassportModule],
  controllers: [SocialController],
  providers: [SocialService, GoogleYouTubeStrategy],
})
export class SocialModule {}
