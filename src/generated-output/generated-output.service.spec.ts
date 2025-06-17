import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GeneratedOutputService } from './generated-output.service';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { Repository } from 'typeorm';
import { CreateGeneratedOutputDTO } from '../common/dto/generated-output/create-generated-output.dto';

// TypeORM 리포지토리에 대한 가짜(mock) 객체를 만듭니다.
// jest.fn()은 Jest가 제공하는 가짜 함수로, 호출 여부나 반환값 등을 조작할 수 있습니다.
const mockOutputRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

// IStorageService에 대한 가짜(mock) 객체를 만듭니다.
const mockStorageService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  // ... 기타 필요한 메소드들
};

describe('GeneratedOutputService', () => {
  let service: GeneratedOutputService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: Repository<GeneratedOutput>;

  // beforeEach는 각 테스트 케이스(it)가 실행되기 전에 항상 먼저 실행됩니다.
  beforeEach(async () => {
    // NestJS의 테스트용 모듈을 만듭니다. 실제 모듈과 유사하지만,
    // 실제 의존성 대신 우리가 만든 가짜 객체를 주입해줍니다.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneratedOutputService, // 테스트하려는 실제 서비스
        {
          provide: getRepositoryToken(GeneratedOutput), // DB 리포지토리 토큰
          useValue: mockOutputRepository, // 실제 리포지토리 대신 가짜 객체 사용
        },
        {
          provide: 'IStorageService', // 스토리지 서비스 토큰
          useValue: mockStorageService, // 실제 스토리지 서비스 대신 가짜 객체 사용
        },
      ],
    }).compile();

    // 테스트 모듈에서 서비스와 리포지토리의 인스턴스를 가져옵니다.
    service = module.get<GeneratedOutputService>(GeneratedOutputService);
    repository = module.get<Repository<GeneratedOutput>>(
      getRepositoryToken(GeneratedOutput),
    );
  });

  // 모든 테스트가 끝난 후, 가짜 함수들의 기록을 초기화합니다.
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 'create' 메소드를 테스트하는 케이스
  it('should correctly create and save an output record', async () => {
    // 1. 준비 (Arrange / Given)
    // 테스트에 사용할 DTO 객체를 만듭니다.
    const createDTO: CreateGeneratedOutputDTO = {
      r2Url: 'https://example.com/image.png',
      originalFilename: 'image.png',
      mimeType: 'image/png',
      promptId: 'prompt-123',
      ownerUserId: 1,
      sourceWorkflowId: 1,
    };

    // 가짜 repository의 create, save 메소드가 어떻게 동작할지 정의합니다.
    // create 메소드는 받은 DTO를 그대로 반환하도록 설정
    mockOutputRepository.create.mockReturnValue(createDTO);
    // save 메소드는 성공 시 '저장된 결과' 객체를 반환하도록 설정
    mockOutputRepository.save.mockResolvedValue({
      id: 1,
      ...createDTO,
      createdAt: new Date(),
    });

    // 2. 실행 (Act / When)
    // 테스트하려는 service.create 메소드를 호출합니다.
    const result = await service.create(createDTO);

    // 3. 단언 (Assert / Then)
    // 실행 결과가 우리가 기대한 값과 일치하는지 확인합니다.
    expect(result).toBeDefined();
    expect(result.id).toEqual(1);
    expect(result.r2Url).toEqual(createDTO.r2Url);

    // 가짜 repository의 메소드들이 올바르게 호출되었는지 확인합니다.
    expect(mockOutputRepository.create).toHaveBeenCalledWith(createDTO);
    expect(mockOutputRepository.save).toHaveBeenCalledWith(createDTO);
  });

  // TODO: findHistoryByUser 등 다른 메소드에 대한 테스트 케이스 추가
});
