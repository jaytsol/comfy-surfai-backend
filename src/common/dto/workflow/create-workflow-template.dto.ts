import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
  IsUrl, // URL 형식 검사
  IsDefined, // definition은 객체여야 하며, 비어있지 않아야 함 (IsNotEmpty는 객체에 부적합할 수 있음)
} from 'class-validator';
import { WorkflowParameterMappingItemDTO } from './workflow-parameter-mapping-item.dto';

export class CreateWorkflowTemplateDTO {
  @ApiProperty({
    description: '템플릿 이름',
    example: '초상화 생성 v1',
    maxLength: 255,
  })
  @IsString({ message: '템플릿 이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '템플릿 이름을 입력해주세요.' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: '템플릿 설명',
    example: '고품질 초상화 생성 워크플로우',
    maxLength: 1000,
  })
  @IsString({ message: '템플릿 설명은 문자열이어야 합니다.' })
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'ComfyUI 워크플로우 원본 JSON 정의',
    type: 'object',
    additionalProperties: true,
    example: { '3': { inputs: {}, class_type: 'KSampler' } },
  })
  @IsObject({ message: '워크플로우 정의는 객체 형태여야 합니다.' })
  @IsDefined({ message: '워크플로우 정의(definition)를 입력해주세요.' }) // IsNotEmpty 대신 IsDefined 사용 (빈 객체도 객체로 인정)
  definition: object;

  @ApiPropertyOptional({
    description: '동적 파라미터와 실제 워크플로우 노드/입력 매핑 정보',
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/WorkflowParameterMappingItemDTO',
    },
    example: {
      positive_prompt: {
        node_id: '6',
        input_name: 'text',
        label: 'Positive Prompt',
        description: '이미지의 주요 요소를 설명합니다. 상세할수록 좋습니다.',
        type: 'textarea',
      },
      seed: {
        node_id: '3',
        input_name: 'seed',
        label: 'Seed',
        description:
          '이미지 생성의 무작위성을 제어하는 시드 값입니다. -1로 설정하면 랜덤 시드가 사용됩니다.',
        type: 'number',
      },
    },
  })
  @IsObject({ message: '파라미터 맵은 객체 형태여야 합니다.' })
  @IsOptional()
  parameter_map?: Record<string, WorkflowParameterMappingItemDTO>;

  @ApiPropertyOptional({
    description: '미리보기 이미지 URL',
    example: 'https://example.com/preview.jpg',
  })
  @IsUrl({}, { message: '미리보기 이미지는 유효한 URL 형식이어야 합니다.' })
  @IsOptional()
  @MaxLength(2048)
  previewImageUrl?: string;

  @ApiPropertyOptional({
    description: '태그 배열',
    example: ['portrait', 'realistic'],
  })
  @IsArray({ message: '태그는 배열 형태여야 합니다.' })
  @IsString({ each: true, message: '배열의 각 태그는 문자열이어야 합니다.' })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: '템플릿 공개 여부 (일반 사용자에게 노출될지)',
    example: false,
    default: false,
  })
  @IsBoolean({ message: '공개 여부는 불리언 값이어야 합니다.' })
  @IsOptional()
  isPublicTemplate?: boolean = false;
}
