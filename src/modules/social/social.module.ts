import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialConnection } from './entities/social-connection.entity';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [TypeOrmModule.forFeature([SocialConnection])],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}
