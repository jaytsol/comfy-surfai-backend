import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ComfyuiController } from './comfyui/comfyui.controller';
import { ComfyuiService } from './comfyui/comfyui.service';
import { ComfyuiModule } from './comfyui/comfyui.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ComfyuiModule,
  ],
  controllers: [AppController, ComfyuiController],
  providers: [AppService, ComfyuiService],
})
export class AppModule {}
