// src/comfyui/comfyui.module.ts
import { Module } from '@nestjs/common';
import { ComfyUIService } from './comfyui.service';
import { ComfyUIController } from './comfyui.controller';
import { WorkflowModule } from '../workflow/workflow.module';
import { StorageModule } from '../storage/storage.module';
import { GeneratedOutputModule } from '../generated-output/generated-output.module';
// HttpModule 등 ComfyUI 통신에 필요한 다른 모듈들도 여기에 포함될 수 있습니다.
// import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    WorkflowModule, // WorkflowService를 사용하기 위해 WorkflowModule을 임포트
    StorageModule, // CloudflareR2Service를 사용하기 위해 StorageModule을 임포트
    GeneratedOutputModule,
    // HttpModule.register({ timeout: 5000, maxRedirects: 5 }), // 예시: HTTP 통신용 모듈
  ],
  controllers: [ComfyUIController],
  providers: [ComfyUIService],
})
export class ComfyUIModule {}
