// src/workflow/workflow.controller.ts
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
  Get, // req.user.id를 가져오기 위해
} from '@nestjs/common';
import { WorkflowService } from './workflow.service'; // 곧 생성할 서비스
import { AuthenticatedGuard } from '../common/guards/authenticated.guard'; // 경로 확인 및 수정 필요
import { RolesGuard } from '../common/guards/roles.guard'; // 경로 확인 및 수정 필요
import { Roles } from '../common/decorators/roles.decorator'; // 경로 확인 및 수정 필요
import { Role } from '../common/enums/role.enum'; // User 모듈의 Role Enum 경로 확인 및 수정 필요

import { CreateWorkflowTemplateDTO } from 'src/common/dto/workflow/create-workflow-template.dto'; // 곧 생성할 DTO
import { WorkflowTemplateResponseDTO } from 'src/common/dto/workflow/workflow-template.response.dto'; // 곧 생성할 DTO

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Workflow } from '../common/entities/workflow.entity'; // 실제 엔티티 경로로 수정 필요
import { UpdateWorkflowTemplateDTO } from 'src/common/dto/workflow/update-workflow-template.dto';

@ApiTags('Admin - Workflow Templates') // Swagger UI 그룹핑 태그
@ApiCookieAuth() // 이 컨트롤러의 모든 API는 쿠키 인증 필요함을 명시
@UseGuards(AuthenticatedGuard, RolesGuard) // 모든 라우트에 가드 적용
@Roles(Role.Admin) // 이 컨트롤러의 모든 라우트는 Admin 역할 필요
@Controller('workflow-templates') // 이 컨트롤러의 기본 경로
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post() // POST /workflow-templates
  @HttpCode(HttpStatus.CREATED) // 성공 시 201 Created 상태 코드 반환
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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 입력 값입니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자입니다.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한이 없습니다 (Admin 역할 필요).',
  })
  async createTemplate(
    @Body() createWorkflowTemplateDTO: CreateWorkflowTemplateDTO,
    @Request() req, // 현재 로그인한 사용자 정보를 가져오기 위해
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id; // 요청을 보낸 관리자의 ID

    // WorkflowService의 createTemplate 메소드 호출 (실제 로직은 서비스에 구현)
    const newWorkflowTemplate = await this.workflowService.createTemplate(
      createWorkflowTemplateDTO,
      adminUserId,
    );

    // 생성된 엔티티를 응답 DTO로 변환하여 반환
    // 이 변환 로직은 서비스 내부에 있거나, 별도의 매퍼 함수/클래스를 사용할 수 있습니다.
    // 여기서는 간단히 서비스가 변환된 DTO를 반환한다고 가정하거나, 직접 매핑합니다.
    return this.mapWorkflowToResponseDTO(newWorkflowTemplate);
  }

  @Get() // GET /workflow-templates
  @ApiOperation({ summary: '모든 워크플로우 템플릿 목록 조회 (Admin 전용)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '워크플로우 템플릿 목록을 반환합니다.',
    type: [WorkflowTemplateResponseDTO], // 응답이 DTO 배열임을 명시
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않음',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한 없음 (Admin 역할 필요)',
  })
  async findAllTemplates() // @Query() query: ListWorkflowTemplatesQueryDto, // 향후 페이지네이션/필터링 사용 시
  : Promise<WorkflowTemplateResponseDTO[]> {
    const workflowEntities =
      await this.workflowService.findAllTemplates(/* query */);
    // 여러 엔티티를 각각 DTO로 변환
    return workflowEntities.map((workflow) =>
      this.mapWorkflowToResponseDTO(workflow),
    );
  }

  // --- 특정 워크플로우 템플릿 상세 조회 ---
  @Get(':id') // GET /workflow-templates/:id
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 ID의 템플릿을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않음',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한 없음 (Admin 역할 필요)',
  })
  async findOneTemplate(
    @Param('id', ParseIntPipe) id: number, // 경로 파라미터 'id'를 숫자로 변환 및 유효성 검사
  ): Promise<WorkflowTemplateResponseDTO> {
    const workflowEntity = await this.workflowService.findOneTemplateById(id);
    // 서비스에서 NotFoundException을 던지므로, 여기서는 성공 시 DTO 변환만 처리
    return this.mapWorkflowToResponseDTO(workflowEntity);
  }

  @Patch(':id') // PATCH /workflow-templates/:id
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '수정할 템플릿을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 입력 값입니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않았습니다.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한이 없습니다 (Admin 역할 필요).',
  })
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDTO: UpdateWorkflowTemplateDTO,
    @Request() req,
  ): Promise<WorkflowTemplateResponseDTO> {
    const adminUserId = req.user.id; // 현재 요청을 보낸 관리자의 ID

    // WorkflowService의 updateTemplate 메소드 호출
    const updatedWorkflowEntity = await this.workflowService.updateTemplate(
      id,
      updateDTO,
      adminUserId, // 수정 작업을 수행한 관리자 ID (로깅 또는 추가 권한 검증에 사용 가능)
    );

    // 서비스에서 NotFoundException 등을 던질 수 있으므로, 여기서는 성공 케이스만 처리
    // 또는 try-catch로 서비스에서 발생한 특정 예외를 여기서 다른 HTTP 예외로 변환할 수도 있습니다.

    // 업데이트된 엔티티를 응답 DTO로 변환하여 반환
    return this.mapWorkflowToResponseDTO(updatedWorkflowEntity);
  }

  // ... removeTemplate 메소드는 이전 답변 참고 ...

  // Helper method to map Workflow entity to WorkflowTemplateResponseDTO
  // 이전에 createTemplate 메소드에 추가했던 DTO 매핑 함수입니다.
  // 일관성을 위해 이 함수를 사용하거나, class-transformer 등의 라이브러리를 고려할 수 있습니다.
  private mapWorkflowToResponseDTO(
    workflow: Workflow,
  ): WorkflowTemplateResponseDTO {
    if (!workflow) {
      // 이 경우는 서비스 레벨에서 NotFoundException 등으로 이미 처리되었어야 합니다.
      // 하지만 방어적으로 null 체크를 할 수 있습니다.
      throw new NotFoundException(
        'Workflow data for mapping is unexpectedly null.',
      );
    }

    // WorkflowTemplateResponseDTO 정의에 맞게 필드 매핑
    const responseDTO = new WorkflowTemplateResponseDTO();
    responseDTO.id = workflow.id;
    responseDTO.name = workflow.name;
    responseDTO.description = workflow.description;
    responseDTO.definition = workflow.definition || {};
    responseDTO.parameter_map = workflow.parameter_map;
    responseDTO.previewImageUrl = workflow.previewImageUrl;
    responseDTO.tags = workflow.tags;
    responseDTO.isPublicTemplate = workflow.isPublicTemplate;
    responseDTO.ownerUserId = workflow.ownerUserId; // DTO에서 optional 이므로, 값이 없으면 undefined가 됨
    responseDTO.createdAt = workflow.createdAt;
    responseDTO.updatedAt = workflow.updatedAt;

    return responseDTO;
  }
}
