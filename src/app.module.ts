import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ComfyuiController } from './comfyui/comfyui.controller';
import { ComfyuiService } from './comfyui/comfyui.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController, ComfyuiController],
  providers: [AppService, ComfyuiService],
})
export class AppModule {}
