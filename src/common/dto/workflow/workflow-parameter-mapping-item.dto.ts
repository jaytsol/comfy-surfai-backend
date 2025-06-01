import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
// WorkflowParameterMappingItem 인터페이스는 workflow.entity.ts에 정의되어 있다고 가정합니다.
// 만약 별도로 정의했다면 해당 경로에서 import 합니다.
// import { WorkflowParameterMappingItem } from 'src/common/entities/workflow.entity';

// 인터페이스를 직접 implements 하기보다는, DTO는 DTO 자체의 역할에 집중하도록 합니다.
// 필요한 속성을 동일하게 정의합니다.
export class WorkflowParameterMappingItemDTO {
  @ApiProperty({
    description: '매핑될 ComfyUI 워크플로우 내 노드의 ID (문자열 형태의 숫자)',
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
}
