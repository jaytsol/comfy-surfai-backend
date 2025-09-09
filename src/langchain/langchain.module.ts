import { Module } from '@nestjs/common';
import { LangchainController } from './langchain.controller';
import { LangchainService } from './langchain.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [LangchainController],
  providers: [LangchainService],
})
export class LangchainModule {}
