import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LangchainService {
  private readonly logger = new Logger(LangchainService.name);
  private readonly langchainApiUrl: string;
  private readonly internalApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const langchainApiUrl = this.configService.get<string>('LANGCHAIN_API_URL');
    const internalApiKey = this.configService.get<string>(
      'LANGCHAIN_INTERNAL_API_KEY',
    );

    if (!langchainApiUrl || !internalApiKey) {
      this.logger.error('Langchain service is not configured.');
      throw new InternalServerErrorException(
        'LLM 서비스가 설정되지 않았습니다.',
      );
    }

    this.langchainApiUrl = langchainApiUrl;
    this.internalApiKey = internalApiKey;
  }

  private async postToLangchain<T>(
    endpoint: string,
    data: unknown,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(`${this.langchainApiUrl}${endpoint}`, data, {
          headers: {
            'X-Internal-API-Key': this.internalApiKey,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Error calling Langchain service at ${endpoint}: ${error.message}`,
          error.stack,
        );
        this.logger.error('Response data:', error.response?.data);
      } else {
        this.logger.error(
          `An unexpected error occurred at ${endpoint}: ${error.message}`,
          error.stack,
        );
      }
      throw new InternalServerErrorException(
        'LLM 서비스 호출 중 오류가 발생했습니다.',
      );
    }
  }

  async chat(prompt: string): Promise<string> {
    const result = await this.postToLangchain<{ response: string }>(
      '/api/v1/chat',
      { prompt },
    );
    return result.response;
  }

  async processRagDocument(documentId: number, r2Url: string): Promise<void> {
    await this.postToLangchain('/api/v1/rag/process', { documentId, r2Url });
  }

  async queryRagDocument(documentId: number, message: string): Promise<any> {
    return this.postToLangchain('/api/v1/rag/query', { documentId, message });
  }
}
