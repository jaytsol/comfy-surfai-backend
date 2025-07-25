import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ComfyUIController } from './comfyui/comfyui.controller';
import { ComfyUIService } from './comfyui/comfyui.service';
import { ComfyUIModule } from './comfyui/comfyui.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './common/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ConfigService } from '@nestjs/config';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { Workflow } from './common/entities/workflow.entity';
import { EventsGateway } from './common/events/events.gateway';
import { StorageModule } from './storage/storage.module';
import { GeneratedOutputModule } from './generated-output/generated-output.module';
import { GeneratedOutput } from './common/entities/generated-output.entity';
import { AdminModule } from './modules/admin.module';
import { CoinTransaction } from './common/entities/coin-transaction.entity'; // CoinTransaction 엔티티 임포트
import { CoinModule } from './coin/coin.module';

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
      entities: [User, Workflow, GeneratedOutput, CoinTransaction], // CoinTransaction 엔티티 추가
      synchronize: false, // 마이그레이션 사용을 위해 false로 설정
      logging: true,
      migrations: [__dirname + '/migrations/**/*.js'], // 마이그레이션 파일 경로
    }),
    AuthModule,
    ComfyUIModule,
    GeneratedOutputModule,
    WorkflowModule,
    StorageModule,
    AdminModule,
    CoinModule, // CoinModule 추가
  ],
  controllers: [AppController, ComfyUIController],
  providers: [AppService, ComfyUIService, EventsGateway],
})
export class AppModule {}
