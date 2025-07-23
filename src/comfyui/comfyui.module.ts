// src/comfyui/comfyui.module.ts
import { Module } from '@nestjs/common';
import { ComfyUIService } from './comfyui.service';
import { ComfyUIController } from './comfyui.controller';
import { StorageModule } from '../storage/storage.module';
import { GeneratedOutputModule } from '../generated-output/generated-output.module';
import { WorkflowModule } from 'src/admin/workflow/workflow.module';
import { CoinModule } from 'src/coin/coin.module'; // CoinModule 임포트

@Module({
  imports: [WorkflowModule, StorageModule, GeneratedOutputModule, CoinModule],
  controllers: [ComfyUIController],
  providers: [ComfyUIService],
})
export class ComfyUIModule {}
