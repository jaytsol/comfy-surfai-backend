import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ComfyUIController } from './comfyui/comfyui.controller';
import { ComfyUIService } from './comfyui/comfyui.service';
import { ComfyUIModule } from './comfyui/comfyui.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigService } from '@nestjs/config';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { EventsGateway } from './common/events/events.gateway';
import { StorageModule } from './storage/storage.module';
import { GeneratedOutputModule } from './generated-output/generated-output.module';
import { AdminModule } from './modules/admin.module';
import { CoinModule } from './coin/coin.module';
import { SocialModule } from './modules/social/social.module';
import { LangchainModule } from './langchain/langchain.module';
import { RagModule } from './modules/rag/rag.module';
import {
  User,
  Workflow,
  GeneratedOutput,
  CoinTransaction,
  RagDocument,
} from './common/entities';
import { SocialConnection } from './modules/social/entities/social-connection.entity';

const configService = new ConfigService();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: configService.get<string>('DB_HOST') || 'localhost',
      port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
      username: configService.get<string>('DB_USERNAME'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_DATABASE'),
      entities: [
        User,
        Workflow,
        GeneratedOutput,
        CoinTransaction,
        SocialConnection,
        RagDocument,
      ],
      synchronize: false,
      logging: true,
      migrations: [__dirname + '/migrations/**/*.js'],
    }),
    AuthModule,
    ComfyUIModule,
    GeneratedOutputModule,
    WorkflowModule,
    StorageModule,
    AdminModule,
    CoinModule,
    SocialModule,
    LangchainModule,
    RagModule,
  ],
  controllers: [AppController, ComfyUIController],
  providers: [AppService, ComfyUIService, EventsGateway],
})
export class AppModule {}
