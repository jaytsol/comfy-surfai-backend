import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratedOutputResponseDto {
  @ApiProperty({ description: '생성물의 고유 ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Cloudflare R2에 저장된 파일 URL',
    example: 'https://your-r2-bucket.pub/outputs/...',
  })
  r2Url: string;

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
}
