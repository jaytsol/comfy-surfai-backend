// src/common/dto/workflow/workflow-parameter-mapping-item.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Validation을 위한 DTO ---
export class ParameterValidationDTO {
  @ApiPropertyOptional({ description: '필수 여부', type: Boolean })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ description: '최소값', type: Number })
  @IsNumber()
  @IsOptional()
  min?: number;

  @ApiPropertyOptional({ description: '최대값', type: Number })
  @IsNumber()
  @IsOptional()
  max?: number;

  @ApiPropertyOptional({ description: '증감 단위', type: Number })
  @IsNumber()
  @IsOptional()
  step?: number;
}

// --- 메인 DTO ---
export class WorkflowParameterMappingItemDTO {
  @ApiProperty({
    description: '매핑될 ComfyUI 워크플로우 내 노드의 ID',
    example: '6',
  })
  @IsString()
  @IsNotEmpty()
  node_id: string;

  @ApiProperty({
    description: '매핑될 노드 내 입력(input)의 이름',
    example: 'text',
  })
  @IsString()
  @IsNotEmpty()
  input_name: string;

  @ApiProperty({
    description: 'UI에 표시될 이름',
    example: 'Positive Prompt',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: '프론트엔드 UI에 표시될 파라미터에 대한 설명 (툴팁용)',
    example: '생성할 이미지의 주된 내용을 상세히 기술하세요.',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'UI 입력 필드 타입',
    enum: ['text', 'number', 'textarea', 'select', 'boolean'],
    example: 'textarea',
  })
  @IsEnum(['text', 'number', 'textarea', 'select', 'boolean'])
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean';

  @ApiPropertyOptional({
    description: '필드의 기본값',
    example: 'A beautiful landscape painting.',
  })
  @IsOptional()
  default_value?: any;

  @ApiPropertyOptional({
    description: "type이 'select'일 경우 선택 옵션 목록",
    type: [String],
    example: ['euler', 'dpmpp_2m_sde'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({
    description: '데이터 유효성 검사 규칙',
    type: () => ParameterValidationDTO,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ParameterValidationDTO)
  @IsOptional()
  validation?: ParameterValidationDTO;
}