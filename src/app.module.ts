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

const configService = new ConfigService();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: configService.get<string>('DB_HOST') || 'localhost',
      port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
      username: configService.get<string>('DB_USERNAME'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_DATABASE'),
      entities: [User],
      synchronize: true,
      logging: true,
    }),
    AuthModule,
    ComfyUIModule,
  ],
  controllers: [AppController, ComfyUIController],
  providers: [AppService, ComfyUIService],
})
export class AppModule {}
