import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ComfyuiController } from './comfyui/comfyui.controller';
import { ComfyuiService } from './comfyui/comfyui.service';
import { ComfyuiModule } from './comfyui/comfyui.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './auth/entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [User],
      synchronize: true,
      logging: true,
    }),
    AuthModule,
    ComfyuiModule,
  ],
  controllers: [AppController, ComfyuiController],
  providers: [AppService, ComfyuiService],
})
export class AppModule {}
