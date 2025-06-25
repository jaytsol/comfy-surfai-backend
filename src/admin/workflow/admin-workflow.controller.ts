import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminWorkflowService } from './admin-workflow.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { WorkflowTemplate } from 'src/common/interfaces/workflow.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Workflow } from 'src/common/entities/workflow.entity';
import { WorkflowTemplateResponseDTO } from 'src/common/dto/workflow/workflow-template.response.dto';

@ApiTags('Admin - Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/workflows')
export class AdminWorkflowController {
  constructor(private readonly adminWorkflowService: AdminWorkflowService) {}

  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: '모든 워크플로우 템플릿 조회 (관리자용)' })
  @ApiResponse({
    status: 200,
    description: '성공적으로 모든 워크플로우 템플릿 목록을 반환합니다.',
    type: [WorkflowTemplateResponseDTO],
  })
  @ApiResponse({ status: 403, description: '접근 권한 없음 (Forbidden)' })
  async findAll(): Promise<WorkflowTemplate[]> {
    const allTemplates: Workflow[] =
      await this.adminWorkflowService.findAllTemplates();

    const validTemplates = allTemplates.filter(
      (template): template is WorkflowTemplate => !!template.definition,
    );

    return validTemplates;
  }
}
