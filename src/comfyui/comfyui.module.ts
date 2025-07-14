// src/comfyui/comfyui.module.ts
import { Module } from '@nestjs/common';
import { ComfyUIService } from './comfyui.service';
import { ComfyUIController } from './comfyui.controller';
import { StorageModule } from '../storage/storage.module';
import { GeneratedOutputModule } from '../generated-output/generated-output.module';
import { WorkflowModule } from 'src/admin/workflow/workflow.module';

@Module({
  imports: [WorkflowModule, StorageModule, GeneratedOutputModule],
  controllers: [ComfyUIController],
  providers: [ComfyUIService],
})
export class ComfyUIModule {}
