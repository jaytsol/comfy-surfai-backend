import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  IsDefined,
} from 'class-validator';

export class CreateWorkflowTemplateDTO {
  @ApiProperty({
    description: '템플릿 이름',
    example: '초상화 생성 v1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: '템플릿 설명',
    example: '고품질 초상화 생성 워크플로우',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '워크플로우 카테고리',
    example: 'image',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'ComfyUI 워크플로우 원본 JSON 정의',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  @IsDefined()
  definition: object;

  @ApiPropertyOptional({
    description: '미리보기 이미지 URL',
    example: 'https://example.com/preview.jpg',
  })
  @IsUrl()
  @IsOptional()
  previewImageUrl?: string;

  @ApiPropertyOptional({
    description: '태그 배열',
    example: ['portrait', 'realistic'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: '템플릿 공개 여부',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublicTemplate?: boolean = false;
}
