import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowParameterMappingItem } from 'src/common/interfaces/workflow.interface';

export class WorkflowTemplateResponseDTO {
  @ApiProperty({ example: 1, description: '워크플로우 템플릿의 고유 ID' })
  id: number;

  @ApiProperty({ example: '초상화 생성 v1', description: '템플릿 이름' })
  name: string;

  @ApiPropertyOptional({
    example: '고품질 초상화 생성 워크플로우',
    description: '템플릿 설명',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'image',
    description: '워크플로우 카테고리',
  })
  category?: string;

  @ApiProperty({
    type: 'object',
    description: 'ComfyUI 워크플로우 원본 JSON 정의',
    additionalProperties: true,
  })
  definition: object;

  @ApiPropertyOptional({
    description: '동적 파라미터 매핑 정보',
    type: 'object',
    additionalProperties: {
      // Swagger UI에서 중첩 객체 타입을 더 잘 표현하기 위함
      type: 'object',
      properties: {
        node_id: { type: 'string', example: '6' },
        input_name: { type: 'string', example: 'text' },
      },
    },
    example: {
      positive_prompt: { node_id: '6', input_name: 'text' },
      seed: { node_id: '3', input_name: 'seed' },
    },
  })
  parameter_map?: Record<string, WorkflowParameterMappingItem>;

  @ApiPropertyOptional({
    example: 'https://example.com/preview.jpg',
    description: '미리보기 이미지 URL',
  })
  previewImageUrl?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['portrait', 'realistic'],
    description: '태그 배열',
  })
  tags?: string[];

  @ApiProperty({ example: false, description: '템플릿 공개 여부' })
  isPublicTemplate: boolean;

  @ApiPropertyOptional({
    // 옵션 A 결정에 따라 Optional로 변경
    example: 101,
    description:
      '템플릿을 생성/소유한 관리자의 ID (시스템 템플릿의 경우 없을 수 있음)',
  })
  ownerUserId?: number; // 선택적 필드로 변경

  @ApiProperty({ description: '템플릿 생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '템플릿 마지막 수정 일시' })
  updatedAt: Date;

  // isTemplate, sourceTemplateId 등의 필드는 이 DTO에서는 제외하거나, 필요에 따라 추가할 수 있습니다.
  // 현재는 "템플릿"에 대한 응답이므로 isTemplate=true가 명확하고, sourceTemplateId는 null이므로 생략 가능.
}
