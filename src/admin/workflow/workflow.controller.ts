import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Param,
  NotFoundException,
  ParseIntPipe,
  Get,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateWorkflowTemplateDTO } from 'src/common/dto/workflow/create-workflow-template.dto';
import { UpdateParameterMapDTO } from 'src/common/dto/workflow/update-parameter-map.dto';
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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ParameterPreset } from 'src/common/constants/parameter-presets';

@ApiTags('Admin - Workflow Templates')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('workflow-templates')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // --- 사전 설정 및 카테고리 API ---
  @Get('parameter-presets')
  @ApiOperation({ summary: '파라미터 사전 설정 목록 조회' })
  getParameterPresets(@Query('category') category?: string): ParameterPreset[] {
    return this.workflowService.getParameterPresets(category);
  }

  @Get('categories')
  @ApiOperation({ summary: '사용 가능한 모든 워크플로우 카테고리 목록 조회' })
  getWorkflowCategories(): string[] {
    return this.workflowService.getWorkflowCategories();
  }

  // --- 1단계: 워크플로우 템플릿 뼈대 생성 ---
  @Post()
  @ApiOperation({ summary: '1단계: 새 워크플로우 템플릿 생성 (뼈대)' })
  @ApiResponse({ status: 201, type: WorkflowTemplateResponseDTO })
  async createTemplate(
    @Body() createDTO: CreateWorkflowTemplateDTO,
    @Request() req,
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id;
    const newTemplate = await this.workflowService.createTemplate(createDTO, adminUserId);
    return this.mapWorkflowToResponseDTO(newTemplate);
  }

  // --- 2단계: 파라미터 맵 설정 ---
  @Put(':id/parameter-map')
  @ApiOperation({ summary: '2단계: 워크플로우 템플릿의 파라미터 맵 설정' })
  @ApiResponse({ status: 200, type: WorkflowTemplateResponseDTO })
  async updateParameterMap(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDTO: UpdateParameterMapDTO,
    @Request() req,
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id;
    const updatedTemplate = await this.workflowService.updateParameterMap(id, updateDTO, adminUserId);
    return this.mapWorkflowToResponseDTO(updatedTemplate);
  }

  // --- 전체 목록 및 단일 조회 ---
  @Get()
  @ApiOperation({ summary: '모든 워크플로우 템플릿 목록 조회' })
  async findAllTemplates(): Promise<WorkflowTemplateResponseDTO[]> {
    const templates = await this.workflowService.findAllTemplates();
    return templates.map(this.mapWorkflowToResponseDTO);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 워크플로우 템플릿 상세 조회' })
  async findOneTemplate(@Param('id', ParseIntPipe) id: number): Promise<WorkflowTemplateResponseDTO> {
    const template = await this.workflowService.findOneTemplateById(id);
    return this.mapWorkflowToResponseDTO(template);
  }

  // --- 삭제 ---
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '워크플로우 템플릿 삭���' })
  async removeTemplate(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    const adminUserId = req.user.id;
    await this.workflowService.removeTemplate(id, adminUserId);
  }

  // --- DTO 매퍼 ---
  private mapWorkflowToResponseDTO(workflow: Workflow): WorkflowTemplateResponseDTO {
    if (!workflow) {
      throw new NotFoundException('Workflow data for mapping is unexpectedly null.');
    }
    const responseDTO = new WorkflowTemplateResponseDTO();
    responseDTO.id = workflow.id;
    responseDTO.name = workflow.name;
    responseDTO.description = workflow.description;
    responseDTO.category = workflow.category;
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
