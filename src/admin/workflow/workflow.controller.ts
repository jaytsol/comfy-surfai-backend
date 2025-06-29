// src/admin/workflow/workflow.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Patch,
  Param,
  NotFoundException,
  ParseIntPipe,
  Get,
  Delete,
  Query,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateWorkflowTemplateDTO } from 'src/common/dto/workflow/create-workflow-template.dto';
import { WorkflowTemplateResponseDTO } from 'src/common/dto/workflow/workflow-template.response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Workflow } from 'src/common/entities/workflow.entity';
import { UpdateWorkflowTemplateDTO } from 'src/common/dto/workflow/update-workflow-template.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ParameterPreset } from 'src/common/constants/parameter-presets';

@ApiTags('Admin - Workflow Templates')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('workflow-templates')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('parameter-presets')
  @ApiOperation({ summary: '파라미터 사전 설정 목록 조회 (Admin 전용)' })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: '필터링할 워크플로우 카테고리',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '파라미터 사전 설정 목록을 반환합니다.',
  })
  getParameterPresets(@Query('category') category?: string): ParameterPreset[] {
    return this.workflowService.getParameterPresets(category);
  }

  @Get('categories')
  @ApiOperation({ summary: '사용 가능한 모든 워크플로우 카테고리 목록 조회 (Admin 전용)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카테고리 이름 배열을 반환합니다.',
    type: [String],
  })
  getWorkflowCategories(): string[] {
    return this.workflowService.getWorkflowCategories();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '새로운 워크플로우 템플릿 생성 (Admin 전용)' })
  @ApiBody({
    type: CreateWorkflowTemplateDTO,
    description: '생성할 워크플로우 템플릿 정보',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '템플릿이 성공적으로 생성됨.',
    type: WorkflowTemplateResponseDTO,
  })
  async createTemplate(
    @Body() createWorkflowTemplateDTO: CreateWorkflowTemplateDTO,
    @Request() req,
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id;
    const newWorkflowTemplate = await this.workflowService.createTemplate(
      createWorkflowTemplateDTO,
      adminUserId,
    );
    return this.mapWorkflowToResponseDTO(newWorkflowTemplate);
  }

  @Get()
  @ApiOperation({ summary: '모든 워크플로우 템플릿 목록 조회 (Admin 전용)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '워크플로우 템플릿 목록을 반환합니다.',
    type: [WorkflowTemplateResponseDTO],
  })
  async findAllTemplates(): Promise<WorkflowTemplateResponseDTO[]> {
    const workflowEntities = await this.workflowService.findAllTemplates();
    return workflowEntities.map((workflow) =>
      this.mapWorkflowToResponseDTO(workflow),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 워크플로우 템플릿 상세 조회 (Admin 전용)' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '조회할 워크플로우 템플릿의 ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '워크플로우 템플릿 상세 정보를 반환합니다.',
    type: WorkflowTemplateResponseDTO,
  })
  async findOneTemplate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkflowTemplateResponseDTO> {
    const workflowEntity = await this.workflowService.findOneTemplateById(id);
    return this.mapWorkflowToResponseDTO(workflowEntity);
  }

  @Patch(':id')
  @ApiOperation({ summary: '기존 워크플로우 템플릿 수정 (Admin 전용)' })
  @ApiParam({ name: 'id', type: Number, description: '수정할 템플릿 ID' })
  @ApiBody({
    type: UpdateWorkflowTemplateDTO,
    description: '수정할 워크플로우 템플릿 정보 (부분 업데이트)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '템플릿 수정 성공. 수정된 템플릿 정보를 반환합니다.',
    type: WorkflowTemplateResponseDTO,
  })
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDTO: UpdateWorkflowTemplateDTO,
    @Request() req,
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id;
    const updatedWorkflowEntity = await this.workflowService.updateTemplate(
      id,
      updateDTO,
      adminUserId,
    );
    return this.mapWorkflowToResponseDTO(updatedWorkflowEntity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '워크플로우 템플릿 삭제 (Admin 전용)' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '삭제할 워크플로우 템플릿의 ID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '워크플로우 템플릿이 성공적으로 삭제됨.',
  })
  async removeTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    const adminUserId = req.user.id;
    await this.workflowService.removeTemplate(id, adminUserId);
  }

  private mapWorkflowToResponseDTO(
    workflow: Workflow,
  ): WorkflowTemplateResponseDTO {
    if (!workflow) {
      throw new NotFoundException(
        'Workflow data for mapping is unexpectedly null.',
      );
    }
    const responseDTO = new WorkflowTemplateResponseDTO();
    responseDTO.id = workflow.id;
    responseDTO.name = workflow.name;
    responseDTO.description = workflow.description;
    responseDTO.definition = workflow.definition || {};
    responseDTO.parameter_map = workflow.parameter_map;
    responseDTO.previewImageUrl = workflow.previewImageUrl;
    responseDTO.tags = workflow.tags;
    responseDTO.isPublicTemplate = workflow.isPublicTemplate;
    responseDTO.ownerUserId = workflow.ownerUserId;
    responseDTO.createdAt = workflow.createdAt;
    responseDTO.updatedAt = workflow.updatedAt;
    return responseDTO;
  }
}