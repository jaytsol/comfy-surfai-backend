// src/comfyui/comfyui.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ComfyuiService } from 'src/comfyui/comfyui.service';
import {
  ComfyUIResult,
  ComfyUIWorkflow,
} from 'src/common/interfaces/comfyui-workflow.interface';
import { AuthenticatedGuard } from 'src/common/guards/authenticated.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('api')
export class ComfyuiController {
  constructor(private readonly comfyuiService: ComfyuiService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
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
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error('Failed to send prompt to ComfyUI');
    }
  }
}
