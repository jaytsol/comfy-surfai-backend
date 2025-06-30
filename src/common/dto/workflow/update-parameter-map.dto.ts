import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNotEmptyObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowParameterMappingItemDTO } from './workflow-parameter-mapping-item.dto';

export class UpdateParameterMapDTO {
  @ApiProperty({
    description: '업데이트할 파라미터 맵 전체 객체',
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/WorkflowParameterMappingItemDTO',
    },
  })
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => WorkflowParameterMappingItemDTO)
  parameter_map: Record<string, WorkflowParameterMappingItemDTO>;
}
