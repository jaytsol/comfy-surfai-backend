import { PartialType } from '@nestjs/swagger'; // 또는 @nestjs/mapped-types 에서 가져올 수 있습니다.
import { CreateWorkflowTemplateDTO } from './create-workflow-template.dto';

export class UpdateWorkflowTemplateDTO extends PartialType(
  CreateWorkflowTemplateDTO,
) {}
