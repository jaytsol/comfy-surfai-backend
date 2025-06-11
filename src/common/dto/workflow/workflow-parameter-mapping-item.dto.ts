import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class WorkflowParameterMappingItemDto {
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

  @ApiPropertyOptional({
    description: '프론트엔드 UI에 표시될 파라미터에 대한 설명 (툴팁용)',
    example: '생성할 이미지의 주된 내용을 상세히 기술하세요.',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
