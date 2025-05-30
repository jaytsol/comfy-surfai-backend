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
import { ComfyUIService as ComfyUIService } from 'src/comfyui/comfyui.service';
import {
  ComfyUIResult,
  ComfyUIWorkflow,
} from 'src/common/interfaces/comfyui-workflow.interface';
import { AuthenticatedGuard } from 'src/common/guards/authenticated.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('api')
export class ComfyUIController {
  constructor(private readonly comfyuiService: ComfyUIService) {}

  @ApiCookieAuth() // 이 컨트롤러의 모든 API가 쿠키 인증을 필요로 함을 명시 (또는 각 메소드에 개별 적용)
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'ComfyUI를 사용하여 이미지 생성 요청',
    description:
      '관리자(admin) 역할만 접근 가능합니다. ComfyUI 워크플로우를 전달하여 이미지 생성을 요청합니다.',
  })
  @ApiBody({
    description: 'ComfyUI 워크플로우 JSON 객체',
  }) // ComfyUIWorkflow가 클래스 DTO일 때 type 지정
  @ApiResponse({
    status: HttpStatus.OK,
    description: '이미지 생성 작업 요청 성공',
  }) // ComfyUIResult가 클래스 DTO일 때 type 지정
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않음 (로그인 필요)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '접근 권한 없음 (관리자 역할 필요)',
  })
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
