import { Test, TestingModule } from '@nestjs/testing';
import { ComfyUIService } from './comfyui.service';
import { ConfigService } from '@nestjs/config';
import { WorkflowService } from '../modules/workflow/workflow.service';
import { GeneratedOutputService } from '../generated-output/generated-output.service';
import { IStorageService } from '../storage/interfaces/storage.interface';
import { CoinService } from '../coin/coin.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CoinTransactionReason } from '../common/entities/coin-transaction.entity';

describe('ComfyUIService (Unit Tests)', () => {
  let service: ComfyUIService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;
  let workflowService: WorkflowService;
  let generatedOutputService: GeneratedOutputService;
  let storageService: IStorageService;
  let coinService: CoinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComfyUIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'COMFYUI_HOST') return 'test-comfyui.com';
              if (key === 'NGINX_USERNAME') return 'testuser';
              if (key === 'NGINX_PASSWORD') return 'testpass';
              return null;
            }),
          },
        },
        {
          provide: WorkflowService,
          useValue: {
            findOneTemplateById: jest.fn().mockResolvedValue({
              id: 1,
              name: 'Test Workflow',
              definition: {},
              parameter_map: {},
              cost: 100, // 템플릿 비용 모의
            }),
          },
        },
        {
          provide: GeneratedOutputService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              r2Url: 'https://example.com/mock-r2-url.png',
              originalFilename: 'mock.png',
              mimeType: 'image/png',
              promptId: 'mock-prompt-id',
              ownerUserId: 1,
              sourceWorkflowId: 1,
              createdAt: new Date(),
            }),
          },
        },
        {
          provide: 'IStorageService',
          useValue: {
            uploadFile: jest
              .fn()
              .mockResolvedValue('http://example.com/uploaded.png'),
            getSignedUrl: jest
              .fn()
              .mockResolvedValue('http://example.com/signed.png'),
          },
        },
        {
          provide: CoinService,
          useValue: {
            getBalance: jest.fn().mockResolvedValue(1000), // 초기 코인 잔액 1000으로 모의
            deductCoins: jest.fn().mockResolvedValue({ coinBalance: 900 }),
          },
        },
      ],
    }).compile();

    service = module.get<ComfyUIService>(ComfyUIService);
    configService = module.get<ConfigService>(ConfigService);
    workflowService = module.get<WorkflowService>(WorkflowService);
    generatedOutputService = module.get<GeneratedOutputService>(
      GeneratedOutputService,
    );
    storageService = module.get<IStorageService>('IStorageService');
    coinService = module.get<CoinService>(CoinService);

    // WebSocket 연결 로직 모의 (실제 연결 방지)
    jest
      .spyOn(service as any, 'connectToComfyUIWebSocket')
      .mockImplementation(() => {});
    jest
      .spyOn(service as any, 'sendPromptToComfyUI')
      .mockResolvedValue({ prompt_id: 'test-prompt-id' });
    jest
      .spyOn(service as any, 'uploadBase64ImageToComfyUI')
      .mockResolvedValue({ name: 'uploaded_image.png' });
    jest.spyOn(service.wsMessage$, 'emit'); // wsMessage$.emit을 스파이로 만듭니다.
    jest.spyOn(service['promptMetadata'], 'delete'); // promptMetadata.delete를 스파이로 만듭니다.
  }); // beforeEach 닫는 괄호

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateImageFromTemplate', () => {
    const mockGenerateDto = {
      templateId: 1,
      parameters: {},
      inputImage: undefined,
    };
    const mockAdminUserId = 1;

    it('should successfully generate an image and deduct coins', async () => {
      // given
      const expectedCost = 100;
      (workflowService.findOneTemplateById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Workflow',
        definition: {},
        parameter_map: {},
        cost: expectedCost,
      });
      (coinService.getBalance as jest.Mock).mockResolvedValue(500); // 충분한 코인

      // when
      const result = await service.generateImageFromTemplate(
        mockGenerateDto,
        mockAdminUserId,
      );

      // then
      expect(workflowService.findOneTemplateById).toHaveBeenCalledWith(
        mockGenerateDto.templateId,
      );
      expect(coinService.getBalance).toHaveBeenCalledWith(mockAdminUserId);
      expect(coinService.deductCoins).toHaveBeenCalledWith(
        mockAdminUserId,
        expectedCost,
        CoinTransactionReason.IMAGE_GENERATION,
      );
      expect(service['sendPromptToComfyUI']).toHaveBeenCalled();
      expect(result).toEqual({ prompt_id: 'test-prompt-id' });
    });

    it('should throw HttpException if user has insufficient coins', async () => {
      // given
      const expectedCost = 100;
      (workflowService.findOneTemplateById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Workflow',
        definition: {},
        parameter_map: {},
        cost: expectedCost,
      });
      (coinService.getBalance as jest.Mock).mockResolvedValue(50); // 부족한 코인

      // when & then
      await expect(
        service.generateImageFromTemplate(mockGenerateDto, mockAdminUserId),
      ).rejects.toThrow(
        new HttpException('코인이 부족합니다.', HttpStatus.BAD_REQUEST),
      );
      expect(coinService.deductCoins).not.toHaveBeenCalled(); // 코인 차감은 호출되지 않아야 함
      expect(service['sendPromptToComfyUI']).not.toHaveBeenCalled(); // ComfyUI 호출되지 않아야 함
    });

    it('should handle input image upload', async () => {
      // given
      const mockDtoWithImage = {
        ...mockGenerateDto,
        inputImage: 'base64image',
      };
      (workflowService.findOneTemplateById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Workflow',
        definition: {
          '6': { inputs: { image: ['7', 0] } }, // input_image를 사용하는 노드 정의
        },
        parameter_map: {
          input_image: { node_id: '6', input_name: 'image' },
        },
        cost: 100,
      });
      (coinService.getBalance as jest.Mock).mockResolvedValue(500);

      // when
      await service.generateImageFromTemplate(
        mockDtoWithImage,
        mockAdminUserId,
      );

      // then
      expect(service['uploadBase64ImageToComfyUI']).toHaveBeenCalledWith(
        'base64image',
      );
      // sendPromptToComfyUI가 올바른 workflow 정의를 받았는지 확인하는 추가적인 expect 필요
    });
  });

  describe('handleExecutionResult', () => {
    it('should process and upload generated images to R2 and save to DB', async () => {
      // given
      const mockMessage = {
        type: 'executed',
        data: {
          prompt_id: 'test-prompt-id-123',
          output: {
            images: [{ filename: 'output.png', type: 'temp', subfolder: '' }],
          },
        },
      };
      const mockUserId = 1;
      const mockTemplateId = 1;
      const mockUsedParameters = { seed: 123 };

      jest.spyOn(service['promptMetadata'], 'get').mockReturnValue({
        userId: mockUserId,
        templateId: mockTemplateId,
        startTime: Date.now() - 10000, // 10초 전 시작
        parameters: mockUsedParameters,
      });
      jest
        .spyOn(service as any, 'downloadFromComfyUI')
        .mockResolvedValue(Buffer.from('image data'));

      // when
      await service['handleExecutionResult'](
        mockMessage as any,
        mockUserId,
        mockTemplateId,
        mockUsedParameters,
      );

      // then
      expect(service['downloadFromComfyUI']).toHaveBeenCalledWith(
        mockMessage.data.output.images[0],
      );
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining('outputs/1/test-prompt-id-123/output.png'),
        Buffer.from('image data'),
        'image/png',
      );
      expect(generatedOutputService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          r2Url: 'http://example.com/uploaded.png',
          ownerUserId: mockUserId,
          sourceWorkflowId: mockTemplateId,
          usedParameters: mockUsedParameters,
          duration: expect.any(Number),
        }),
      );
      expect(service.wsMessage$.emit).toHaveBeenCalledWith(
        'generation_result',
        expect.objectContaining({ type: 'generation_result' }),
      );
    });

    it('should handle multiple image outputs', async () => {
      // given
      const mockMessage = {
        type: 'executed',
        data: {
          prompt_id: 'test-prompt-id-multi',
          output: {
            images: [
              { filename: 'output1.png', type: 'temp', subfolder: '' },
              { filename: 'output2.png', type: 'temp', subfolder: '' },
            ],
          },
        },
      };
      const mockUserId = 1;
      const mockTemplateId = 1;

      jest.spyOn(service['promptMetadata'], 'get').mockReturnValue({
        userId: mockUserId,
        templateId: mockTemplateId,
        startTime: Date.now(),
      });
      jest
        .spyOn(service as any, 'downloadFromComfyUI')
        .mockResolvedValue(Buffer.from('image data'));

      // when
      await service['handleExecutionResult'](
        mockMessage as any,
        mockUserId,
        mockTemplateId,
      );

      // then
      expect(generatedOutputService.create).toHaveBeenCalledTimes(2);
      expect(storageService.uploadFile).toHaveBeenCalledTimes(2);
    });

    it('should handle video (gif) outputs', async () => {
      // given
      const mockMessage = {
        type: 'executed',
        data: {
          prompt_id: 'test-prompt-id-gif',
          output: {
            gifs: [{ filename: 'output.gif', type: 'temp', subfolder: '' }],
          },
        },
      };
      const mockUserId = 1;
      const mockTemplateId = 1;

      jest.spyOn(service['promptMetadata'], 'get').mockReturnValue({
        userId: mockUserId,
        templateId: mockTemplateId,
        startTime: Date.now(),
      });
      jest
        .spyOn(service as any, 'downloadFromComfyUI')
        .mockResolvedValue(Buffer.from('gif data'));

      // when
      await service['handleExecutionResult'](
        mockMessage as any,
        mockUserId,
        mockTemplateId,
      );

      // then
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining('outputs/1/test-prompt-id-gif/output.gif'),
        Buffer.from('gif data'),
        'image/gif', // getMimeType이 gif에 대해 올바른 MIME 타입을 반환하는지 확인
      );
      expect(generatedOutputService.create).toHaveBeenCalledTimes(1);
    });

    it('should not process if no images or gifs in output', async () => {
      // given
      const mockMessage = {
        type: 'executed',
        data: {
          prompt_id: 'test-prompt-id-no-output',
          output: {},
        },
      };
      const mockUserId = 1;
      const mockTemplateId = 1;

      jest.spyOn(service['promptMetadata'], 'get').mockReturnValue({
        userId: mockUserId,
        templateId: mockTemplateId,
        startTime: Date.now(),
      });

      // when
      await service['handleExecutionResult'](
        mockMessage as any,
        mockUserId,
        mockTemplateId,
      );

      // then
      expect(generatedOutputService.create).not.toHaveBeenCalled();
      expect(storageService.uploadFile).not.toHaveBeenCalled();
      expect(service.wsMessage$.emit).not.toHaveBeenCalled();
      expect(service['promptMetadata'].delete).not.toHaveBeenCalled(); // 추가
    });
  });
});
