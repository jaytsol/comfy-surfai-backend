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
  Patch,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateWorkflowTemplateDTO } from 'src/common/dto/workflow/create-workflow-template.dto';
import { UpdateWorkflowTemplateDTO } from 'src/common/dto/workflow/update-workflow-template.dto';
import { WorkflowTemplateResponseDTO } from 'src/common/dto/workflow/workflow-template.response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Workflow } from 'src/common/entities/workflow.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ParameterPreset } from 'src/common/constants/parameter-presets';
import { WorkflowParameterMappingItemDTO } from 'src/common/dto/workflow/workflow-parameter-mapping-item.dto';
import { ParameterMapCategory } from 'src/common/enums/parameter-map-category.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto'; // PaginationDto 임포트
import { PaginatedResponse } from 'src/common/interfaces/pagination.interface'; // PaginatedResponse 임포트

@ApiTags('Admin - Workflow Templates')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.User)
@Controller('workflow-templates')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Roles(Role.Admin, Role.User)
  @Get('parameter-presets')
  @ApiOperation({ summary: '파라미터 사전 설정 목록 조회' })
  getParameterPresets(
    @Query('category') category?: ParameterMapCategory,
  ): ParameterPreset[] {
    return this.workflowService.getParameterPresets(category);
  }

  @Roles(Role.Admin, Role.User)
  @Get('categories')
  @ApiOperation({ summary: '사용 가능한 모든 워크플로우 카테고리 목록 조회' })
  getWorkflowCategories(): string[] {
    return this.workflowService.getWorkflowCategories();
  }

  @Roles(Role.Admin)
  @Post()
  @ApiOperation({ summary: '1단계: 새 워크플로우 템플릿 생성 (뼈대)' })
  @ApiResponse({ status: 201, type: WorkflowTemplateResponseDTO })
  async createTemplate(
    @Body() createDTO: CreateWorkflowTemplateDTO,
    @Request() req,
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id;
    const newTemplate = await this.workflowService.createTemplate(
      createDTO,
      adminUserId,
    );
    return this.mapWorkflowToResponseDTO(newTemplate);
  }

  @Roles(Role.Admin)
  @Put(':id/parameter-map')
  @ApiOperation({ summary: '2단계: 워크플로우 템플릿의 파라미터 맵 설정' })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: {
        $ref: '#/components/schemas/WorkflowParameterMappingItemDTO',
      },
    },
  })
  @ApiResponse({ status: 200, type: WorkflowTemplateResponseDTO })
  async updateParameterMap(
    @Param('id', ParseIntPipe) id: number,
    @Body() parameterMap: Record<string, WorkflowParameterMappingItemDTO>,
    @Request() req,
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id;
    const updatedTemplate = await this.workflowService.updateParameterMap(
      id,
      parameterMap,
      adminUserId,
    );
    return this.mapWorkflowToResponseDTO(updatedTemplate);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  @ApiOperation({ summary: '전체 워크플로우 템플릿 정보 수정 (편집 페이지용)' })
  @ApiResponse({ status: 200, type: WorkflowTemplateResponseDTO })
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDTO: UpdateWorkflowTemplateDTO,
    @Request() req,
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id;
    const updatedTemplate = await this.workflowService.updateTemplate(
      id,
      updateDTO,
      adminUserId,
    );
    return this.mapWorkflowToResponseDTO(updatedTemplate);
  }

  @Roles(Role.Admin, Role.User)
  @Get()
  @ApiOperation({ summary: '모든 워크플로우 템플릿 목록 조회' })
  async findAllTemplates(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<WorkflowTemplateResponseDTO>> {
    const paginatedTemplates =
      await this.workflowService.findAllTemplates(paginationDto);
    return {
      ...paginatedTemplates,
      data: paginatedTemplates.data.map((t) =>
        this.mapWorkflowToResponseDTO(t),
      ),
    };
  }

  @Roles(Role.Admin, Role.User)
  @Get(':id')
  @ApiOperation({ summary: '특정 워크플로우 템플릿 상세 조회' })
  async findOneTemplate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkflowTemplateResponseDTO> {
    const template = await this.workflowService.findOneTemplateById(id);
    return this.mapWorkflowToResponseDTO(template);
  }

  @Roles(Role.Admin, Role.Admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '워크플로우 템플릿 삭제' })
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
    responseDTO.category = workflow.category;
    responseDTO.definition = workflow.definition || {};
    responseDTO.parameter_map = workflow.parameter_map;
    responseDTO.previewImageUrl = workflow.previewImageUrl;
    responseDTO.tags = workflow.tags;
    responseDTO.cost = workflow.cost;
    responseDTO.isPublicTemplate = workflow.isPublicTemplate;
    responseDTO.ownerUserId = workflow.ownerUserId;
    responseDTO.createdAt = workflow.createdAt;
    responseDTO.updatedAt = workflow.updatedAt;
    return responseDTO;
  }
}
