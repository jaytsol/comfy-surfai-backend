import { Test, TestingModule } from '@nestjs/testing';
import { GeneratedOutputService } from './generated-output.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, IsNull } from 'typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { Workflow } from '../common/entities/workflow.entity';
import { IStorageService } from '../storage/interfaces/storage.interface';
import { CoinService } from '../coin/coin.service';
import { WorkflowService } from '../admin/workflow/workflow.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CoinTransaction,
  CoinTransactionReason,
  CoinTransactionType,
} from '../common/entities/coin-transaction.entity'; // CoinTransaction 임포트 추가

describe('GeneratedOutputService (Unit Tests)', () => {
  let service: GeneratedOutputService;
  let outputRepository: Repository<GeneratedOutput>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let workflowRepository: Repository<Workflow>;
  let storageService: IStorageService;
  let coinService: CoinService;
  let workflowService: WorkflowService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  const mockUser = { id: 100, email: 'test@example.com' }; // 간단한 User mock
  const mockWorkflow = { id: 1, name: 'Test Workflow' }; // 간단한 Workflow mock

  const mockGeneratedOutput: GeneratedOutput = {
    id: 1,
    ownerUserId: 100,
    r2Url: 'https://example.com/output/1.png',
    sourceWorkflowId: 1,
    originalFilename: 'test_image.png',
    mimeType: 'image/png',
    promptId: 'test-prompt-id-123',
    createdAt: new Date(),
    ownerUser: mockUser as any,
    sourceWorkflow: mockWorkflow as any,
  };

  const mockCreateDto = {
    ownerUserId: 100,
    sourceWorkflowId: 1,
    r2Url: 'https://example.com/output/new.png',
    originalFilename: 'new_image.png',
    mimeType: 'image/png',
    promptId: 'new-prompt-id-456',
    // ... 기타 필드 (실제 DTO에 맞게 추가)
  };

  beforeEach(async () => {
    // console.error와 console.log를 모의 처리하여 테스트 출력에서 제외
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // QueryRunner Mock 설정
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest
          .fn()
          .mockImplementation((entity, dto) =>
            Object.assign(new entity(), dto),
          ), // create는 dto를 그대로 반환하도록
        save: jest.fn().mockResolvedValue(mockGeneratedOutput), // save는 저장된 엔티티 반환
        findOne: jest.fn().mockResolvedValue(null), // 기본적으로 findOne은 null 반환
      },
    } as unknown as QueryRunner; // 타입 단언

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneratedOutputService,
        {
          provide: getRepositoryToken(GeneratedOutput),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Workflow),
          useClass: Repository,
        },
        {
          provide: 'IStorageService', // Custom Provider Token
          useValue: {
            getSignedUrl: jest.fn().mockResolvedValue('signed-url'),
            deleteFile: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CoinService,
          useValue: {
            deductCoins: jest.fn().mockResolvedValue({ coinBalance: 900 }), // 코인 차감 성공 시
            addCoins: jest.fn().mockResolvedValue({ coinBalance: 1000 }), // 코인 추가 성공 시
          },
        },
        {
          provide: WorkflowService,
          useValue: {
            getWorkflowCost: jest.fn().mockResolvedValue(100), // 워크플로우 비용 100으로 모의
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<GeneratedOutputService>(GeneratedOutputService);
    outputRepository = module.get<Repository<GeneratedOutput>>(
      getRepositoryToken(GeneratedOutput),
    );
    workflowRepository = module.get<Repository<Workflow>>(
      getRepositoryToken(Workflow),
    );
    storageService = module.get<IStorageService>('IStorageService');
    coinService = module.get<CoinService>(CoinService);
    workflowService = module.get<WorkflowService>(WorkflowService);
    dataSource = module.get<DataSource>(DataSource);

    // Repository 메서드 모의 (필요한 경우)
    jest
      .spyOn(outputRepository, 'findOneBy')
      .mockResolvedValue(mockGeneratedOutput);
    jest
      .spyOn(outputRepository, 'findAndCount')
      .mockResolvedValue([[mockGeneratedOutput], 1]);
    jest
      .spyOn(outputRepository, 'remove')
      .mockResolvedValue(mockGeneratedOutput);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a generated output and deduct coins within a transaction', async () => {
      // given
      const expectedCost = 100;
      workflowService.getWorkflowCost = jest
        .fn()
        .mockResolvedValue(expectedCost);

      // queryRunner.manager.save가 첫 호출(GeneratedOutput)에는 mockGeneratedOutput을,
      // 두 번째 호출(CoinTransaction 업데이트)에는 업데이트된 CoinTransaction을 반환하도록 설정
      queryRunner.manager.save = jest
        .fn()
        .mockResolvedValueOnce(mockGeneratedOutput) // GeneratedOutput 저장
        .mockResolvedValueOnce({
          id: 1,
          relatedEntityId: mockGeneratedOutput.id.toString(),
        }); // CoinTransaction 저장

      // CoinTransaction을 찾도록 모의
      queryRunner.manager.findOne = jest.fn().mockResolvedValueOnce({
        id: 1,
        userId: mockCreateDto.ownerUserId,
        type: CoinTransactionType.DEDUCT,
        reason: CoinTransactionReason.IMAGE_GENERATION,
        relatedEntityId: null,
        createdAt: new Date(),
      });

      // when
      const result = await service.create(mockCreateDto);

      // then
      expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
      expect(queryRunner.connect).toHaveBeenCalledTimes(1);
      expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);

      expect(workflowService.getWorkflowCost).toHaveBeenCalledWith(
        mockCreateDto.sourceWorkflowId,
      );
      expect(coinService.deductCoins).toHaveBeenCalledWith(
        mockCreateDto.ownerUserId,
        expectedCost,
        CoinTransactionReason.IMAGE_GENERATION,
        undefined, // 초기 relatedEntityId는 undefined
        queryRunner, // queryRunner가 전달되었는지 확인
      );

      expect(queryRunner.manager.create).toHaveBeenCalledWith(
        GeneratedOutput,
        mockCreateDto,
      );
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(queryRunner.manager.save).toHaveBeenNthCalledWith(
        1,
        expect.any(GeneratedOutput), // 생성된 GeneratedOutput 인스턴스
      );

      // CoinTransaction 업데이트 로직 확인
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(
        CoinTransaction,
        {
          where: {
            userId: mockCreateDto.ownerUserId,
            type: CoinTransactionType.DEDUCT,
            reason: CoinTransactionReason.IMAGE_GENERATION,
            relatedEntityId: IsNull(),
          },
          order: { createdAt: 'DESC' },
        },
      );
      expect(queryRunner.manager.save).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          relatedEntityId: mockGeneratedOutput.id.toString(),
        }),
      );

      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled(); // 롤백은 호출되지 않아야 함
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGeneratedOutput);
    });

    it('should rollback transaction if coin deduction fails due to insufficient balance', async () => {
      // given
      const expectedCost = 100;
      workflowService.getWorkflowCost = jest
        .fn()
        .mockResolvedValue(expectedCost);
      coinService.deductCoins = jest
        .fn()
        .mockRejectedValue(new BadRequestException('코인 잔액이 부족합니다.')); // 코인 차감 실패 모의

      // when
      await expect(service.create(mockCreateDto)).rejects.toThrow(
        BadRequestException,
      );

      // then
      expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
      expect(queryRunner.connect).toHaveBeenCalledTimes(1);
      expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);

      expect(workflowService.getWorkflowCost).toHaveBeenCalledWith(
        mockCreateDto.sourceWorkflowId,
      );
      expect(coinService.deductCoins).toHaveBeenCalledWith(
        mockCreateDto.ownerUserId,
        expectedCost,
        CoinTransactionReason.IMAGE_GENERATION,
        undefined,
        queryRunner,
      );

      expect(queryRunner.manager.create).not.toHaveBeenCalled(); // GeneratedOutput 생성되지 않음
      expect(queryRunner.manager.save).not.toHaveBeenCalled(); // GeneratedOutput 저장되지 않음
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled(); // 커밋되지 않음
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1); // 롤백 호출됨
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback transaction if saving generated output fails', async () => {
      // given
      const expectedCost = 100;
      workflowService.getWorkflowCost = jest
        .fn()
        .mockResolvedValue(expectedCost);
      coinService.deductCoins = jest
        .fn()
        .mockResolvedValue({ coinBalance: 900 }); // 코인 차감 성공 모의

      // GeneratedOutput 저장 시 에러 발생 모의
      queryRunner.manager.save = jest
        .fn()
        .mockRejectedValue(new InternalServerErrorException('DB 저장 실패'));

      // when
      await expect(service.create(mockCreateDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      // then
      expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
      expect(queryRunner.connect).toHaveBeenCalledTimes(1);
      expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);

      expect(workflowService.getWorkflowCost).toHaveBeenCalledWith(
        mockCreateDto.sourceWorkflowId,
      );
      expect(coinService.deductCoins).toHaveBeenCalledWith(
        mockCreateDto.ownerUserId,
        expectedCost,
        CoinTransactionReason.IMAGE_GENERATION,
        undefined,
        queryRunner,
      );

      expect(queryRunner.manager.create).toHaveBeenCalledWith(
        GeneratedOutput,
        mockCreateDto,
      );
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        expect.any(GeneratedOutput),
      ); // save는 호출되었지만 실패
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled(); // 커밋되지 않음
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1); // 롤백 호출됨
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });
  }); // describe('create') 닫는 괄호

  describe('remove', () => {
    it('should successfully remove a generated output and its R2 file', async () => {
      // given
      const outputId = 1;
      const userId = 100;
      const mockOutput = {
        ...mockGeneratedOutput,
        id: outputId,
        ownerUserId: userId,
        r2Url: 'https://example.com/r2/path/to/file.png',
      };
      jest
        .spyOn(service as any, 'findOneOwnedByUser')
        .mockResolvedValue(mockOutput); // private 메서드 모의

      // when
      await service.remove(outputId, userId);

      // then
      expect(service['findOneOwnedByUser']).toHaveBeenCalledWith(
        outputId,
        userId,
      );
      expect(storageService.deleteFile).toHaveBeenCalledWith(
        'r2/path/to/file.png',
      );
      expect(outputRepository.remove).toHaveBeenCalledWith(mockOutput);
    });

    it('should throw NotFoundException if output not found or not owned by user', async () => {
      // given
      const outputId = 999;
      const userId = 100;
      jest
        .spyOn(service as any, 'findOneOwnedByUser')
        .mockRejectedValue(
          new NotFoundException('Output not found or permission denied.'),
        );

      // when & then
      await expect(service.remove(outputId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(storageService.deleteFile).not.toHaveBeenCalled();
      expect(outputRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if R2 file deletion fails', async () => {
      // given
      const outputId = 1;
      const userId = 100;
      const mockOutput = {
        ...mockGeneratedOutput,
        id: outputId,
        ownerUserId: userId,
        r2Url: 'https://example.com/r2/path/to/file.png',
      };
      jest
        .spyOn(service as any, 'findOneOwnedByUser')
        .mockResolvedValue(mockOutput);
      storageService.deleteFile = jest
        .fn()
        .mockRejectedValue(new Error('R2 deletion failed.'));

      // when & then
      await expect(service.remove(outputId, userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(storageService.deleteFile).toHaveBeenCalledWith(
        'r2/path/to/file.png',
      );
      expect(outputRepository.remove).not.toHaveBeenCalled(); // R2 삭제 실패 시 DB 삭제는 호출되지 않아야 함
    });
  });

  describe('findHistoryByUser', () => {
    it('should return paginated history with signed URLs', async () => {
      // given
      const userId = 100;
      const queryDTO = { page: 1, limit: 10 };
      const mockOutputs = [
        {
          ...mockGeneratedOutput,
          id: 1,
          r2Url: 'https://example.com/r2/output1.png',
        },
        {
          ...mockGeneratedOutput,
          id: 2,
          r2Url: 'https://example.com/r2/output2.png',
        },
      ];
      const totalCount = 2;

      outputRepository.findAndCount = jest
        .fn()
        .mockResolvedValue([mockOutputs, totalCount]);
      storageService.getSignedUrl = jest
        .fn()
        .mockImplementation((key) => Promise.resolve(`signed-url-for-${key}`));

      // when
      const result = await service.findHistoryByUser(userId, queryDTO);

      // then
      expect(outputRepository.findAndCount).toHaveBeenCalledWith({
        where: { ownerUserId: userId },
        order: { createdAt: 'DESC' },
        take: queryDTO.limit,
        skip: (queryDTO.page - 1) * queryDTO.limit,
      });
      expect(storageService.getSignedUrl).toHaveBeenCalledTimes(
        mockOutputs.length,
      );
      expect(storageService.getSignedUrl).toHaveBeenCalledWith(
        'r2/output1.png',
        {
          expiresIn: 3600,
        },
      );
      expect(storageService.getSignedUrl).toHaveBeenCalledWith(
        'r2/output2.png',
        {
          expiresIn: 3600,
        },
      );

      expect(result.data.length).toBe(mockOutputs.length);
      expect(result.total).toBe(totalCount);
      expect(result.data[0]).toHaveProperty(
        'viewUrl',
        'signed-url-for-r2/output1.png',
      );
      expect(result.data[1]).toHaveProperty(
        'viewUrl',
        'signed-url-for-r2/output2.png',
      );
    });

    it('should return empty array if no history found', async () => {
      // given
      const userId = 100;
      const queryDTO = { page: 1, limit: 10 };
      outputRepository.findAndCount = jest.fn().mockResolvedValue([[], 0]);

      // when
      const result = await service.findHistoryByUser(userId, queryDTO);

      // then
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(storageService.getSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('generateViewUrl', () => {
    it('should return a signed URL for viewing', async () => {
      // given
      const outputId = 1;
      const userId = 100;
      const mockOutput = {
        ...mockGeneratedOutput,
        id: outputId,
        ownerUserId: userId,
        r2Url: 'https://example.com/r2/view-file.jpg',
      };
      jest
        .spyOn(service as any, 'findOneOwnedByUser')
        .mockResolvedValue(mockOutput);
      storageService.getSignedUrl = jest
        .fn()
        .mockResolvedValue('view-signed-url');

      // when
      const result = await service.generateViewUrl(outputId, userId);

      // then
      expect(service['findOneOwnedByUser']).toHaveBeenCalledWith(
        outputId,
        userId,
      );
      expect(storageService.getSignedUrl).toHaveBeenCalledWith(
        'r2/view-file.jpg',
        {
          expiresIn: 3600,
        },
      );
      expect(result).toBe('view-signed-url');
    });

    it('should throw NotFoundException if output not found for view URL', async () => {
      // given
      const outputId = 999;
      const userId = 100;
      jest
        .spyOn(service as any, 'findOneOwnedByUser')
        .mockRejectedValue(new NotFoundException('Output not found.'));

      // when & then
      await expect(service.generateViewUrl(outputId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(storageService.getSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('generateDownloadUrl', () => {
    it('should return a signed URL for downloading if not expired', async () => {
      // given
      const outputId = 1;
      const userId = 100;
      const mockOutput = {
        ...mockGeneratedOutput,
        id: outputId,
        ownerUserId: userId,
        r2Url: 'https://example.com/r2/download-file.mp4',
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전 생성 (만료되지 않음)
      };
      jest
        .spyOn(service as any, 'findOneOwnedByUser')
        .mockResolvedValue(mockOutput);
      storageService.getSignedUrl = jest
        .fn()
        .mockResolvedValue('download-signed-url');

      // when
      const result = await service.generateDownloadUrl(outputId, userId);

      // then
      expect(service['findOneOwnedByUser']).toHaveBeenCalledWith(
        outputId,
        userId,
      );
      expect(storageService.getSignedUrl).toHaveBeenCalledWith(
        'r2/download-file.mp4',
        {
          downloadFileName: `surfai-output-${outputId}.mp4`,
          expiresIn: 600,
        },
      );
      expect(result).toBe('download-signed-url');
    });

    it('should throw NotFoundException if output not found for download URL', async () => {
      // given
      const outputId = 999;
      const userId = 100;
      jest
        .spyOn(service as any, 'findOneOwnedByUser')
        .mockRejectedValue(new NotFoundException('Output not found.'));

      // when & then
      await expect(
        service.generateDownloadUrl(outputId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(storageService.getSignedUrl).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the file has expired', async () => {
      // given
      const outputId = 1;
      const userId = 100;
      const mockOutput = {
        ...mockGeneratedOutput,
        id: outputId,
        ownerUserId: userId,
        r2Url: 'https://example.com/r2/expired-file.png',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전 생성 (만료됨)
      };
      jest
        .spyOn(service as any, 'findOneOwnedByUser')
        .mockResolvedValue(mockOutput);

      // when & then
      await expect(
        service.generateDownloadUrl(outputId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(storageService.getSignedUrl).not.toHaveBeenCalled();
    });
  });
});
