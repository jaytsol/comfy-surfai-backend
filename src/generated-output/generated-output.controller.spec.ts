import { Test, TestingModule } from '@nestjs/testing';
import { GeneratedOutputController } from './generated-output.controller';
import { GeneratedOutputService } from './generated-output.service';
import { ListHistoryQueryDTO } from '../common/dto/generated-output/list-history-query.dto';
import { Role } from '../common/enums/role.enum';

// GeneratedOutputService에 대한 가짜(mock) 객체를 만듭니다.
// 이 객체는 컨트롤러가 호출할 메소드들의 가짜 함수를 가집니다.
const mockOutputService = {
  findHistoryByUser: jest.fn(),
  generateViewUrl: jest.fn(),
  generateDownloadUrl: jest.fn(),
  remove: jest.fn(),
};

describe('GeneratedOutputController', () => {
  let controller: GeneratedOutputController;
  let service: GeneratedOutputService;

  beforeEach(async () => {
    // 테스트 모듈을 설정합니다. 컨트롤러와 가짜 서비스를 provider로 등록합니다.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneratedOutputController],
      providers: [
        {
          provide: GeneratedOutputService,
          useValue: mockOutputService,
        },
      ],
    }).compile();

    // 테스트 모듈에서 컨트롤러와 서비스 인스턴스를 가져옵니다.
    controller = module.get<GeneratedOutputController>(
      GeneratedOutputController,
    );
    service = module.get<GeneratedOutputService>(GeneratedOutputService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // 각 테스트가 끝난 후 모든 mock을 초기화합니다.
  });

  // 'findMyHistory' 메소드를 테스트하는 그룹
  describe('findMyHistory', () => {
    it('should call service with correct user id and pagination, and return paginated data', async () => {
      // 1. 준비 (Arrange)
      const userId = 1;
      const queryDto: ListHistoryQueryDTO = { page: 1, limit: 10 };

      // 가짜 req 객체 (user.id를 포함)
      const mockRequest = {
        user: { id: userId, username: 'test', role: Role.Admin },
      };

      // 가짜 서비스가 반환할 데이터
      const mockServiceResult = {
        data: [
          /* 여기에 GeneratedOutputResponseDTO와 유사한 가짜 데이터 10개 */
        ],
        total: 25, // 총 25개의 아이템이 있다고 가정
      };
      // findHistoryByUser가 호출되면 위 데이터를 반환하도록 설정
      jest
        .spyOn(service, 'findHistoryByUser')
        .mockResolvedValue(mockServiceResult);

      // 2. 실행 (Act)
      const result = await controller.findMyHistory(mockRequest, queryDto);

      // 3. 단언 (Assert)
      // 서비스의 findHistoryByUser 메소드가 올바른 인자들로 호출되었는지 확인
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findHistoryByUser).toHaveBeenCalledWith(userId, queryDto);

      // 컨트롤러가 서비스로부터 받은 결과를 올바르게 가공하여 반환하는지 확인
      expect(result.data).toEqual(mockServiceResult.data);
      expect(result.total).toEqual(25);
      expect(result.page).toEqual(1);
      expect(result.lastPage).toEqual(3); // Math.ceil(25 / 10) = 3
    });
  });

  // 'removeOutput' 메소드를 테스트하는 그룹
  describe('removeOutput', () => {
    it('should call service with correct output id and user id', async () => {
      // 1. 준비 (Arrange)
      const userId = 1;
      const outputId = 123;
      const mockRequest = { user: { id: userId } };

      // 서비스의 remove 메소드는 아무것도 반환하지 않으므로, 호출 여부만 확인하면 됩니다.
      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockResolvedValue(undefined);

      // 2. 실행 (Act)
      await controller.removeOutput(outputId, mockRequest);

      // 3. 단언 (Assert)
      // 서비스의 remove 메소드가 올바른 ID들로 호출되었는지 확인
      expect(removeSpy).toHaveBeenCalledWith(outputId, userId);
    });
  });

  // TODO: getViewUrl, getDownloadUrl에 대한 테스트 케이스 추가
});
