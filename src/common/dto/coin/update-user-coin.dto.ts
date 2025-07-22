import { IsNumber, IsString, Min } from 'class-validator';

export class UpdateUserCoinDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  reason: string;
}
