import { Injectable } from '@nestjs/common';
import { WorkflowService } from 'src/workflow/workflow.service';
import { Workflow } from 'src/common/entities/workflow.entity';

@Injectable()
export class AdminWorkflowService {
  constructor(private readonly workflowService: WorkflowService) {}

  async findAllTemplates(): Promise<Workflow[]> {
    return this.workflowService.findAllTemplates();
  }
}
