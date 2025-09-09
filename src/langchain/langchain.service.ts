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

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async chat(prompt: string): Promise<string> {
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

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ response: string }>(
          `${langchainApiUrl}/api/v1/chat`,
          { prompt },
          {
            headers: {
              'X-Internal-API-Key': internalApiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data.response;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Error calling Langchain service: ${error.message}`,
          error.stack,
        );
        this.logger.error('Response data:', error.response?.data);
      } else {
        this.logger.error(
          `An unexpected error occurred: ${error.message}`,
          error.stack,
        );
      }
      throw new InternalServerErrorException(
        'LLM 서비스 호출 중 오류가 발생했습니다.',
      );
    }
  }
}
