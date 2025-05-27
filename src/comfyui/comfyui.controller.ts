// src/comfyui/comfyui.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ComfyuiService } from './comfyui.service';
import {
  ComfyUIResult,
  ComfyUIWorkflow,
} from './interfaces/comfyui-workflow.interface';

@Controller('api')
export class ComfyuiController {
  constructor(private readonly comfyuiService: ComfyuiService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Body() workflow: ComfyUIWorkflow): Promise<ComfyUIResult> {
    try {
      const result = await this.comfyuiService.sendPromptToComfyUI(workflow);
      return {
        success: true,
        message: 'ComfyUI 작업 요청 성공',
        data: result,
      };
    } catch (error) {
      console.error('ComfyUI 작업 요청 실패:', error);
      throw new Error('Failed to send prompt to ComfyUI');
    }
  }
}
