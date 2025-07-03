import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratedOutputResponseDTO {
  @ApiProperty({ description: '생성물의 고유 ID', example: 1 })
  id: number;

  @ApiProperty({
    description: '이미지를 표시하기 위한 미리 서명된 URL',
    example: 'https://...',
  })
  viewUrl: string;

  @ApiProperty({
    description: 'ComfyUI에서 생성된 원본 파일명',
    example: 'ComfyUI_00512_.png',
  })
  originalFilename: string;

  @ApiProperty({ description: '파일의 MIME 타입', example: 'image/png' })
  mimeType: string;

  @ApiProperty({
    description: '생성에 사용된 워크플로우 템플릿의 ID',
    example: 123,
  })
  sourceWorkflowId: number;

  @ApiPropertyOptional({
    description: '생성에 사용된 동적 파라미터들',
    type: 'object',
    example: { positive_prompt: 'a cat astronaut', seed: 42 },
    additionalProperties: true,
  })
  usedParameters?: Record<string, any>;

  @ApiProperty({ description: '생성 일시 (ISO 8601 형식)' })
  createdAt: Date;

  @ApiProperty({ description: '이 결과물을 생성한 ComfyUI 작업의 고유 ID' })
  promptId: string;

  @ApiPropertyOptional({
    description: '생성에 소요된 시간 (초)',
    example: 15.72,
  })
  duration?: number;
}
