import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowTemplateDTO } from './create-workflow-template.dto';
import { IsObject, IsOptional, IsNumber } from 'class-validator';

export class UpdateWorkflowTemplateDTO extends PartialType(
  CreateWorkflowTemplateDTO,
) {
  @IsObject()
  @IsOptional()
  parameter_map?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsNumber()
  @IsOptional()
  requiredImageCount?: number;
}
