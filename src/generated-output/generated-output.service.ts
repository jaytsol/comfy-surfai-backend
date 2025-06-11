import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { CreateGeneratedOutputDto } from '../common/dto/generated-output/create-generated-output.dto';
import { ListHistoryQueryDto } from '../common/dto/generated-output/list-history-query.dto';

@Injectable()
export class GeneratedOutputService {
  constructor(
    @InjectRepository(GeneratedOutput)
    private readonly outputRepository: Repository<GeneratedOutput>,
  ) {}

  /**
   * 생성된 결과물 정보를 데이터베이스에 저장합니다.
   * ComfyUIService에서 R2 업로드 후 호출됩니다.
   * @param createDto 저장할 생성물 정보
   * @returns 저장된 GeneratedOutput 엔티티
   */
  async create(createDto: CreateGeneratedOutputDto): Promise<GeneratedOutput> {
    try {
      const newOutput = this.outputRepository.create(createDto);
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
   * @param queryDto 페이지네이션 옵션 (page, limit)
   * @returns 생성 기록 데이터와 전체 개수를 포함하는 객체
   */
  async findHistoryByUser(
    userId: number,
    queryDto: ListHistoryQueryDto,
  ): Promise<{ data: GeneratedOutput[]; total: number }> {
    const { page = 1, limit = 10 } = queryDto;

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

  // TODO: 향후 특정 생성물 상세 조회, 삭제 등의 메소드 추가
  // async findOneById(id: number, userId: number): Promise<GeneratedOutput> { ... }
  // async remove(id: number, userId: number): Promise<void> { ... }
}
