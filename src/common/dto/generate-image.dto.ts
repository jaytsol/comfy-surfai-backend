import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Min,
  IsString,
} from 'class-validator';

export class GenerateImageDTO {
  @ApiProperty({
    description: '이미지 생성에 사용할 워크플로우 템플릿의 고유 ID',
    example: 1,
    type: Number,
  })
  @IsNumber({}, { message: 'templateId는 숫자여야 합니다.' })
  @IsNotEmpty({ message: 'templateId는 필수 입력 항목입니다.' })
  @Min(1, { message: 'templateId는 0보다 큰 숫자여야 합니다.' }) // ID는 보통 1 이상
  templateId: number;

  @ApiPropertyOptional({
    description: 'string',
    type: 'object',
    example: {
      positive_prompt:
        'A stunning photorealistic image of a cat wearing a wizard hat',
      seed: 123456789012345,
      steps: 30,
      cfg: 7.5,
      // ... 템플릿의 parameter_map에 정의된 다른 키와 값들
    },
    additionalProperties: true, // 객체 내부에 어떤 키든 올 수 있음을 명시 (선택 사항)
  })
  @IsObject({ message: 'parameters는 객체 형태여야 합니다.' })
  @IsOptional()
  parameters?: Record<string, any>; // 값의 타입은 문자열, 숫자, 불리언 등 다양할 수 있습니다.
  // 더 엄격한 타입을 원한다면, 각 파라미터 타입을 개별적으로 정의하는 복잡한 DTO를 만들거나
  // value_type과 함께 커스텀 유효성 검사기를 사용할 수 있습니다.
  // 현재는 Record<string, any>로 유연하게 처리합니다.

  @ApiPropertyOptional({
    description: 'Base64 인코딩된 입력 이미지 데이터 (선택 사항)',
    type: 'string',
    format: 'base64',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  })
  @IsString({ message: 'inputImage는 Base64 문자열이어야 합니다.' })
  @IsOptional()
  inputImage?: string;

  @ApiPropertyOptional({
    description: 'Base64 인코딩된 두 번째 입력 이미지 데이터 (선택 사항)',
    type: 'string',
    format: 'base64',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  })
  @IsString({ message: 'secondInputImage는 Base64 문자열이어야 합니다.' })
  @IsOptional()
  secondInputImage?: string;
}
