import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { CreateGeneratedOutputDto } from '../common/dto/generated-output/create-generated-output.dto';

@Injectable()
export class GeneratedOutputService {
  constructor(
    @InjectRepository(GeneratedOutput)
    private readonly outputRepository: Repository<GeneratedOutput>,
  ) {}

  /**
   * 생성된 결과물 정보를 데이터베이스에 저장합니다.
   * @param createDto 저장할 생성물 정보
   * @returns 저장된 GeneratedOutput 엔티티
   */
  async create(createDto: CreateGeneratedOutputDto): Promise<GeneratedOutput> {
    const newOutput = this.outputRepository.create(createDto);
    return this.outputRepository.save(newOutput);
  }

  // TODO: 향후 히스토리 조회를 위한 메소드들을 여기에 추가합니다.
  // 예: async findHistoryByUser(userId: number, page: number, limit: number) { ... }
}
