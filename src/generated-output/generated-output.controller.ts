import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { GeneratedOutputService } from './generated-output.service';
import { AuthenticatedGuard } from 'src/common/guards/authenticated.guard';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { GeneratedOutputResponseDTO } from '../common/dto/generated-output/generated-output.response.dto';
import { ListHistoryQueryDTO } from '../common/dto/generated-output/list-history-query.dto';

// --- API 응답을 위한 페이지네이션 타입 정의 (공통 타입으로 분리해도 좋습니다) ---
class PaginatedHistoryResponse {
  @ApiProperty({
    type: [GeneratedOutputResponseDTO],
    description: '생성 기록 데이터 배열',
  })
  data: GeneratedOutputResponseDTO[];

  @ApiProperty({ example: 50, description: '전체 결과물의 수' })
  total: number;

  @ApiProperty({ example: 1, description: '현재 페이지 번호' })
  page: number;

  @ApiProperty({ example: 5, description: '마지막 페이지 번호' })
  lastPage: number;
}
// -------------------------------------------------------------------------

@ApiTags('Outputs & History')
@ApiCookieAuth() // 이 컨트롤러의 모든 API는 쿠키 인증 필요
@UseGuards(AuthenticatedGuard) // 로그인한 사용자만 접근 가능
@Controller('my-history') // 엔드포인트 기본 경로
export class GeneratedOutputController {
  constructor(
    private readonly generatedOutputService: GeneratedOutputService,
  ) {}

  @Get(':id/download-url')
  @UseGuards(AuthenticatedGuard) // 로그인한 사용자만 접근 가능
  @ApiOperation({ summary: '생성된 결과물에 대한 다운로드 URL 요청' })
  @ApiResponse({ status: 200, description: '미리 서명된 다운로드 URL 반환' })
  @ApiResponse({
    status: 404,
    description: '결과물을 찾을 수 없거나 접근 권한 없음',
  })
  async getDownloadUrl(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ downloadUrl: string }> {
    const userId = req.user.id;
    // 서비스에 outputId와 userId를 전달하여 권한 확인 및 URL 생성 요청
    const downloadUrl = await this.generatedOutputService.generateDownloadUrl(
      id,
      userId,
    );
    return { downloadUrl };
  }

  @Get() // GET /my-history
  @ApiOperation({
    summary: '나의 생성 기록 목록 조회',
    description:
      '현재 로그인한 사용자의 이미지/비디오 생성 기록을 최신순으로, 페이지네이션하여 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '생성 기록 목록을 성공적으로 반환합니다.',
    type: PaginatedHistoryResponse, // Swagger 문서에 페이지네이션 응답 구조 명시
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자입니다.' })
  async findMyHistory(
    @Request() req,
    @Query() queryDTO: ListHistoryQueryDTO, // 페이지네이션 쿼리 파라미터
  ): Promise<PaginatedHistoryResponse> {
    const userId = req.user.id;
    const page = queryDTO.page ?? 1;
    const limit = queryDTO.limit ?? 10;

    const { data, total } = await this.generatedOutputService.findHistoryByUser(
      userId,
      { page, limit },
    );

    // 엔티티 배열을 응답 dto 배열로 변환
    const responseData = data.map((output) => this.mapToResponseDTO(output));

    return {
      data: responseData,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // 엔티티를 응답 DTO로 변환하는 헬퍼 메소드
  private mapToResponseDTO(
    output: GeneratedOutput,
  ): GeneratedOutputResponseDTO {
    const dto = new GeneratedOutputResponseDTO();
    dto.id = output.id;
    dto.r2Url = output.r2Url;
    dto.originalFilename = output.originalFilename;
    dto.mimeType = output.mimeType;
    dto.sourceWorkflowId = output.sourceWorkflowId;
    dto.usedParameters = output.usedParameters;
    dto.createdAt = output.createdAt;
    return dto;
  }
}
