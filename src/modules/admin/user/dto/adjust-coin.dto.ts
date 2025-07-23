import { IsNumber, IsPositive, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustCoinDto {
  @ApiProperty({ description: '조정할 코인 양', example: 10 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: '조정 타입 (add 또는 deduct)', example: 'add' })
  @IsIn(['add', 'deduct'])
  type: 'add' | 'deduct';
}
