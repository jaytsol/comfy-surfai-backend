import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { CreateGeneratedOutputDTO } from '../common/dto/generated-output/create-generated-output.dto';
import { ListHistoryQueryDTO } from '../common/dto/generated-output/list-history-query.dto';
import { IStorageService } from 'src/storage/interfaces/storage.interface';
import * as path from 'path';
import { CoinService } from 'src/coin/coin.service';
import { CoinTransactionReason } from '@/common/entities/coin-transaction.entity';
import { Workflow } from 'src/common/entities/workflow.entity';
import { WorkflowService } from 'src/admin/workflow/workflow.service';

@Injectable()
export class GeneratedOutputService {
  constructor(
    @InjectRepository(GeneratedOutput)
    private readonly outputRepository: Repository<GeneratedOutput>,
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
    private readonly coinService: CoinService,
    private readonly workflowService: WorkflowService,
  ) {}

  /**
   * (Helper) 특정 사용자가 소유한 단일 결과물을 찾아 반환합니다.
   * 소유권이 없거나 결과물이 없으면 NotFoundException을 던집니다.
   */
  private async findOneOwnedByUser(
    outputId: number,
    userId: number,
  ): Promise<GeneratedOutput> {
    const output = await this.outputRepository.findOneBy({
      id: outputId,
      ownerUserId: userId,
    });
    if (!output) {
      throw new NotFoundException(
        `Output with ID #${outputId} not found or you do not have permission to access it.`,
      );
    }
    return output;
  }

  /**
   * 생성된 결과물 정보를 데이터베이스에 저장합니다.
   * ComfyUIService에서 R2 업로드 후 호출됩니다.
   * @param createDTO 저장할 생성물 정보
   * @returns 저장된 GeneratedOutput 엔티티
   */
  async create(createDTO: CreateGeneratedOutputDTO): Promise<GeneratedOutput> {
    // 1. 워크플로우 템플릿의 비용 조회
    const cost = await this.workflowService.getWorkflowCost(
      createDTO.sourceWorkflowId,
    );

    // 2. 코인 차감
    await this.coinService.deductCoins(
      createDTO.ownerUserId,
      cost,
      CoinTransactionReason.IMAGE_GENERATION,
      // TODO: relatedEntityId는 생성된 output의 ID가 되어야 하지만, 현재 시점에는 알 수 없음.
      // 생성 후 업데이트하거나, 다른 방식으로 연결해야 함.
    );

    try {
      const newOutput = this.outputRepository.create(createDTO);
      const savedOutput = await this.outputRepository.save(newOutput);

      // TODO: 코인 트랜잭션의 relatedEntityId를 savedOutput.id로 업데이트하는 로직 추가 필요

      return savedOutput;
    } catch (error) {
      console.error(
        '[GeneratedOutputService] Failed to create output record:',
        error,
      );
      // 코인 차감 후 생성 기록 저장에 실패했으므로 코인 환불
      await this.coinService.addCoins(
        createDTO.ownerUserId,
        cost,
        CoinTransactionReason.ADMIN_ADJUSTMENT, // 또는 REVERT_GENERATION_COST와 같은 새로운 사유
        `Failed to create output for prompt ${createDTO.promptId}`,
      );
      throw error;
    }
  }

  // ✨ --- 삭제 메소드 --- ✨
  /**
   * 특정 생성 기록을 삭제합니다.
   * R2 스토리지의 실제 파일을 먼저 삭제하고, 그 다음 데이터베이스 레코드를 삭제합니다.
   * @param outputId 삭제할 결과물의 DB ID
   * @param userId 요청한 사용자의 ID (소유권 확인용)
   */
  async remove(outputId: number, userId: number): Promise<void> {
    // 1. DB에서 결과물을 찾고, 동시에 소유권을 확인합니다.
    const output = await this.findOneOwnedByUser(outputId, userId);
    // findOneOwnedByUser는 결과물이 없거나 권한이 없으면 NotFoundException을 던집니다.

    // 2. R2에 저장된 실제 파일 경로(Key)를 추출합니다.
    const r2Key = new URL(output.r2Url).pathname.substring(1);

    try {
      // 3. R2에서 파일을 먼저 삭제합니다.
      await this.storageService.deleteFile(r2Key);
      console.log(
        `[GeneratedOutputService] Successfully deleted file from R2: ${r2Key}`,
      );

      // 4. R2 파일 삭제 성공 시, 데이터베이스에서 레코드를 삭제합니다.
      await this.outputRepository.remove(output);
      console.log(
        `[GeneratedOutputService] Successfully deleted output record from DB: ID #${outputId}`,
      );
    } catch (error) {
      console.error(
        `[GeneratedOutputService] Failed to delete output #${outputId}. Error:`,
        error,
      );
      // R2 파일 삭제나 DB 레코드 삭제 중 오류가 발생할 경우
      throw new InternalServerErrorException(
        '삭제 처리 중 오류가 발생했습니다.',
      );
    }
  }

  /**
   * 특정 사용자의 생성 기록을 최신순으로 조회합니다. (페이지네이션 적용)
   * @param userId 현재 로그인한 사용자의 ID
   * @param queryDTO 페이지네이션 옵션 (page, limit)
   * @returns 생성 기록 데이터와 전체 개수를 포함하는 객체
   */
  async findHistoryByUser(
    userId: number,
    queryDTO: ListHistoryQueryDTO,
  ): Promise<{ data: GeneratedOutput[]; total: number }> {
    const { page = 1, limit = 10 } = queryDTO;

    const [data, total] = await this.outputRepository.findAndCount({
      where: { ownerUserId: userId },
      order: {
        createdAt: 'DESC', // 최신순으로 정렬
      },
      take: limit, // 가져올 개수
      skip: (page - 1) * limit, // 건너뛸 개수
      // relations: ['sourceWorkflow'], // 필요시 사용한 템플릿 정보도 함께 로드
    });

    // 각 결과물에 대해 미리 서명된 URL을 비동기적으로 생성합니다.
    const dataWithUrls = await Promise.all(
      data.map(async (output) => {
        const r2Key = new URL(output.r2Url).pathname.substring(1);
        const viewUrl = await this.storageService.getSignedUrl(r2Key, {
          expiresIn: 3600,
        }); // 1시간 유효
        // 엔티티 객체에 viewUrl을 임시로 추가합니다. (또는 DTO를 사용)
        return {
          ...output,
          viewUrl,
        };
      }),
    );

    return { data: dataWithUrls, total };
  }

  /**
   * 파일을 '표시'하기 위한 미리 서명된 URL을 생성합니다. (예: <img> 태그의 src용)
   * @param outputId 결과물의 DB ID
   * @param userId 요청한 사용자의 ID (소유권 확인용)
   * @returns 인라인 표시에 사용될 미리 서명된 URL 문자열
   */
  async generateViewUrl(outputId: number, userId: number): Promise<string> {
    const output = await this.findOneOwnedByUser(outputId, userId);
    const r2Key = new URL(output.r2Url).pathname.substring(1);

    // downloadFileName 옵션 없이 getSignedUrl 호출
    return this.storageService.getSignedUrl(r2Key, { expiresIn: 3600 }); // 예: URL 유효시간 1시간
  }

  /**
   * 특정 결과물에 대한 다운로드용 미리 서명된 URL을 생성합니다.
   * @param outputId 결과물의 DB ID
   * @param userId 요청한 사용자의 ID (소유권 확인용)
   * @returns 미리 서명된 URL 문자열
   */
  async generateDownloadUrl(outputId: number, userId: number): Promise<string> {
    const output = await this.findOneOwnedByUser(outputId, userId);

    // ✨ --- 파일 만료 확인 로직 추가 --- ✨
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    const isExpired =
      new Date().getTime() - output.createdAt.getTime() > twoDaysInMs;

    if (isExpired) {
      // 파일이 생성된 지 2일이 지났다면, 더 이상 사용할 수 없음을 알립니다.
      throw new NotFoundException(
        'The file has expired and is no longer available for download.',
      );
    }

    const r2Key = new URL(output.r2Url).pathname.substring(1);

    const extension = path.extname(r2Key);
    const newFileName = `surfai-output-${output.id}${extension}`;

    return this.storageService.getSignedUrl(r2Key, {
      downloadFileName: newFileName,
      expiresIn: 600,
    });
  }

  // TODO: 향후 특정 생성물 상세 조회, 삭제 등의 메소드 추가
  // async findOneById(id: number, userId: number): Promise<GeneratedOutput> { ... }
  // async remove(id: number, userId: number): Promise<void> { ... }
}
