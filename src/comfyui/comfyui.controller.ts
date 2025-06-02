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
import { GenerateImageDTO } from 'src/common/dto/generate-image.dto';

@ApiCookieAuth() // 이 컨트롤러의 모든 API가 쿠키 인증을 필요로 함을 명시 (또는 각 메소드에 개별 적용)
@Controller('api')
export class ComfyUIController {
  constructor(private readonly comfyuiService: ComfyUIService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthenticatedGuard, RolesGuard)
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
    @Body() generateDto: GenerateImageDTO, // ✨ GenerateImageDto 사용
    @Request() req,
  ): Promise<any> {
    // Promise<ComfyUIResult> 등으로 실제 반환 타입 명시
    const adminUserId = req.user.id;
    try {
      const result = await this.comfyuiService.generateImageFromTemplate(
        generateDto,
        adminUserId,
      );
      // 성공 응답 구조는 ComfyUI 실제 결과에 맞게 조정
      return {
        success: true,
        message: 'ComfyUI 작업 요청 처리 중입니다.', // 서비스에서 구체적인 메시지 반환 가능
        data: result,
      };
    } catch (error) {
      // 서비스에서 던져진 NotFoundException, InternalServerErrorException 등 다양한 예외 처리
      // NestJS는 알려진 HTTP 예외는 자동으로 적절한 응답으로 변환합니다.
      // 여기서 별도로 처리할 필요 없이 re-throw 하거나, 커스텀 로깅/변환이 필요하면 처리합니다.
      console.error(
        '[ComfyuiController] Image generation failed:',
        error.message,
      );
      throw error; // 서비스에서 발생한 예외를 그대로 전달
    }
  }
}
