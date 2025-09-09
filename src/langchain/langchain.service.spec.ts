import { Test, TestingModule } from '@nestjs/testing';
import { LangchainService } from './langchain.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';

describe('LangchainService', () => {
  let service: LangchainService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LangchainService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LangchainService>(LangchainService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should call langchain API and return a response', async () => {
      const prompt = 'test prompt';
      const mockApiResponse = { response: 'AI response' };
      const mockAxiosResponse: AxiosResponse = {
        data: mockApiResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('http://fake-url') // LANGCHAIN_API_URL
        .mockReturnValueOnce('fake-api-key'); // LANGCHAIN_INTERNAL_API_KEY

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockAxiosResponse));

      const result = await service.chat(prompt);

      expect(configService.get).toHaveBeenCalledWith('LANGCHAIN_API_URL');
      expect(configService.get).toHaveBeenCalledWith(
        'LANGCHAIN_INTERNAL_API_KEY',
      );
      expect(httpService.post).toHaveBeenCalledWith(
        'http://fake-url/api/v1/chat',
        { prompt },
        {
          headers: {
            'X-Internal-API-Key': 'fake-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockApiResponse.response);
    });

    it('should throw InternalServerErrorException if service is not configured', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      await expect(service.chat('test')).rejects.toThrow(
        new InternalServerErrorException('LLM 서비스가 설정되지 않았습니다.'),
      );
    });

    it('should throw InternalServerErrorException if langchain API call fails', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('http://fake-url')
        .mockReturnValueOnce('fake-api-key');

      const errorResponse = new AxiosError('Request failed');
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => errorResponse));

      await expect(service.chat('test')).rejects.toThrow(
        new InternalServerErrorException(
          'LLM 서비스 호출 중 오류가 발생했습니다.',
        ),
      );
    });
  });
});
