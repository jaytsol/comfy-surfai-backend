import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateGeneratedOutputDTO {
  @IsUrl()
  @IsNotEmpty()
  r2Url: string;

  @IsString()
  @IsNotEmpty()
  originalFilename: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsNotEmpty()
  promptId: string;

  @IsNumber()
  @IsNotEmpty()
  ownerUserId: number;

  @IsNumber()
  @IsNotEmpty()
  sourceWorkflowId: number;

  @IsObject()
  @IsOptional()
  usedParameters?: Record<string, any>;
}
