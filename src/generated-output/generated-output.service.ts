import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { CreateGeneratedOutputDTO } from '../common/dto/generated-output/create-generated-output.dto';
import { ListHistoryQueryDTO } from '../common/dto/generated-output/list-history-query.dto';
import { IStorageService } from 'src/storage/interfaces/storage.interface';
import * as path from 'path';

@Injectable()
export class GeneratedOutputService {
  constructor(
    @InjectRepository(GeneratedOutput)
    private readonly outputRepository: Repository<GeneratedOutput>,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 생성된 결과물 정보를 데이터베이스에 저장합니다.
   * ComfyUIService에서 R2 업로드 후 호출됩니다.
   * @param createDTO 저장할 생성물 정보
   * @returns 저장된 GeneratedOutput 엔티티
   */
  async create(createDTO: CreateGeneratedOutputDTO): Promise<GeneratedOutput> {
    try {
      const newOutput = this.outputRepository.create(createDTO);
      return this.outputRepository.save(newOutput);
    } catch (error) {
      console.error(
        '[GeneratedOutputService] Failed to create output record:',
        error,
      );
      // 필요시 더 구체적인 예외 처리
      throw error;
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

    return { data, total };
  }

  /**
   * 특정 결과물에 대한 다운로드용 미리 서명된 URL을 생성합니다.
   * @param outputId 결과물의 DB ID
   * @param userId 요청한 사용자의 ID (소유권 확인용)
   * @returns 미리 서명된 URL 문자열
   */
  async generateDownloadUrl(outputId: number, userId: number): Promise<string> {
    // 1. DB에서 결과물 조회. 동시에 ownerUserId로 소유권 확인
    const output = await this.outputRepository.findOneBy({
      id: outputId,
      ownerUserId: userId,
    });

    if (!output) {
      throw new NotFoundException(
        '결과물을 찾을 수 없거나 접근 권한이 없습니다.',
      );
    }

    // 2. R2에 저장된 실제 파일 경로(Key) 추출
    const r2Key = new URL(output.r2Url).pathname.substring(1);

    // 3. 다운로드 시 사용할 사용자 친화적인 파일명 생성
    // 예: surfai-123.png
    const extension = path.extname(r2Key);
    const newFileName = `surfai-output-${output.id}${extension}`;

    // 4. StorageService를 통해 미리 서명된 URL 생성 요청
    return this.storageService.getSignedUrl(r2Key, {
      downloadFileName: newFileName,
      expiresIn: 600,
    });
  }

  // TODO: 향후 특정 생성물 상세 조회, 삭제 등의 메소드 추가
  // async findOneById(id: number, userId: number): Promise<GeneratedOutput> { ... }
  // async remove(id: number, userId: number): Promise<void> { ... }
}
