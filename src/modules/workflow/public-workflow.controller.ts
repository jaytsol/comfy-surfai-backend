import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/common/interfaces/pagination.interface';
import { Workflow } from 'src/common/entities/workflow.entity';

@Controller('public-workflow-templates')
@UseGuards(JwtAuthGuard)
export class PublicWorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  async findAllPublicTemplates(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Workflow>> {
    return this.workflowService.findAllTemplates(paginationDto, true);
  }
}
