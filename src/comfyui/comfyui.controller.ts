// src/comfyui/comfyui.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComfyUIService as ComfyUIService } from 'src/comfyui/comfyui.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GenerateImageDTO } from 'src/common/dto/generate-image.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiCookieAuth()
@Controller('api')
export class ComfyUIController {
  constructor(private readonly comfyuiService: ComfyUIService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: '워크플로우 템플릿과 파라미터를 사용하여 이미지 생성 (Admin 전용)',
    description:
      'templateId와 동적 파라미터를 전달하여 ComfyUI를 통해 이미지를 생성합니다.',
  })
  @ApiBody({ type: GenerateImageDTO, description: '템플릿 ID와 동적 파라미터' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      '이미지 생성 작업 요청 성공 또는 결과 반환' /* type: ComfyUIResult */,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않음',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한 없음 (Admin 역할 필요)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '요청한 템플릿 ID를 찾을 수 없음',
  })
  async generate(
    @Body() generateDTO: GenerateImageDTO,
    @Request() req,
  ): Promise<any> {
    const adminUserId = req.user.id;
    try {
      const result = await this.comfyuiService.generateImageFromTemplate(
        generateDTO,
        adminUserId,
      );
      return {
        success: true,
        message: 'ComfyUI 작업 요청 처리 중입니다.',
        data: result,
        client_id: this.comfyuiService.client_id,
      };
    } catch (error) {
      console.error(
        '[ComfyuiController] Image generation failed:',
        error.message,
      );
      throw error;
    }
  }
}
