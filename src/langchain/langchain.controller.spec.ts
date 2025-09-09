import { Test, TestingModule } from '@nestjs/testing';
import { LangchainController } from './langchain.controller';
import { LangchainService } from './langchain.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

describe('LangchainController', () => {
  let controller: LangchainController;
  let service: LangchainService;

  const mockLangchainService = {
    chat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LangchainController],
      providers: [
        {
          provide: LangchainService,
          useValue: mockLangchainService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard) // 실제 Guard 로직은 테스트하지 않음
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LangchainController>(LangchainController);
    service = module.get<LangchainService>(LangchainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('chat', () => {
    it('should call langchainService.chat and return the response', async () => {
      const createChatDto: CreateChatDto = { prompt: 'hello' };
      const mockResponse = 'AI says hello';

      jest.spyOn(service, 'chat').mockResolvedValue(mockResponse);

      const result = await controller.chat(createChatDto);

      expect(service.chat).toHaveBeenCalledWith(createChatDto.prompt);
      expect(result).toEqual({ response: mockResponse });
    });
  });
});
