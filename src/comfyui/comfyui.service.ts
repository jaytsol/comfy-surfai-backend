import {
  Inject,
  Injectable,
  OnModuleInit,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  ComfyUIInput,
  ComfyUIResponse,
  ComfyUIWebSocketMessage,
} from 'src/common/interfaces/comfyui-workflow.interface';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { WorkflowService } from 'src/workflow/workflow.service';
import { GenerateImageDTO } from 'src/common/dto/generate-image.dto'; // 경로 확인
import * as path from 'path';
import { IStorageService } from 'src/storage/interfaces/storage.interface';

// ComfyUIRequest 인터페이스 및 기타 로컬 인터페이스 정의
export interface ComfyUIRequest {
  client_id: string;
  prompt: ComfyUIInput;
}
interface ComfyUIMessageEvents {
  message: [ComfyUIWebSocketMessage];
}
interface ComfyUIErrorResponseData {
  message?: string;
}

@Injectable()
export class ComfyUIService implements OnModuleInit {
  private comfyuiUrl: string;
  private comfyuiWsUrl: string;
  private authHeader: string;
  private ws: WebSocket;
  public client_id: string; // WebSocket 연결 식별용

  // ✨ --- 동시성 문제 해결을 위한 변경점 1 --- ✨
  // prompt_id를 키로 사용하여, 해당 작업을 요청한 사용자의 ID와 사용된 템플릿 ID를 저장합니다.
  private promptMetadata = new Map<
    string,
    { userId: number; templateId: number }
  >();

  public readonly wsMessage$: EventEmitter<ComfyUIMessageEvents> =
    new EventEmitter();

  constructor(
    private readonly configService: ConfigService,
    private readonly workflowService: WorkflowService,
    @Inject('IStorageService') private readonly storageService: IStorageService,
  ) {
    const comfyuiHost = this.configService.get<string>('COMFYUI_HOST');
    const username = this.configService.get<string>('NGINX_USERNAME');
    const password = this.configService.get<string>('NGINX_PASSWORD');

    // 이 client_id는 WebSocket 연결 자체를 식별하는 데 사용됩니다.
    this.comfyuiUrl = `https://${comfyuiHost}`;
    const wsProtocol = this.comfyuiUrl.startsWith('https') ? 'wss' : 'ws';
    this.comfyuiWsUrl = `${wsProtocol}://${comfyuiHost}/ws?clientId=${this.client_id}`;

    this.authHeader =
      'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  }

  onModuleInit() {
    this.connectToComfyUIWebSocket();
  }

  private connectToComfyUIWebSocket() {
    if (this.ws && this.ws.readyState < 2) {
      // CONNECTING or OPEN
      console.log('ComfyUI WebSocket is already connected or connecting.');
      return;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
    }
    console.log(
      `Attempting to connect to ComfyUI WebSocket at: ${this.comfyuiWsUrl}`,
    );
    this.ws = new WebSocket(this.comfyuiWsUrl, {
      headers: { Authorization: this.authHeader },
    });
    this.ws.onopen = () =>
      console.log(
        `Successfully connected to ComfyUI WebSocket (clientId: ${this.client_id})`,
      );

    // ✨ --- 동시성 문제 해결을 위한 변경점 2 --- ✨
    // WebSocket 메시지 핸들러는 서비스 초기화 시 한 번만 등록합니다.
    this.ws.onmessage = (event) => {
      try {
        // rawMessage를 얻는 로직 (이전 코드에서 가져옴)
        let rawMessage: string;
        if (typeof event.data === 'string') rawMessage = event.data;
        else if (Buffer.isBuffer(event.data))
          rawMessage = event.data.toString('utf8');
        else if (event.data instanceof ArrayBuffer)
          rawMessage = Buffer.from(event.data).toString('utf8');
        else {
          console.warn('Unexpected WebSocket data type:', typeof event.data);
          return;
        }

        const message = JSON.parse(rawMessage) as ComfyUIWebSocketMessage; // ✨ 여기서 한 번만 파싱

        this.wsMessage$.emit('message', message); // 파싱된 객체 전달

        if (message.type === 'executed' && message.data?.prompt_id) {
          const metadata = this.promptMetadata.get(message.data.prompt_id);
          if (metadata) {
            console.log(
              `[ComfyUIService] Found metadata for completed prompt #${message.data.prompt_id}. Starting post-processing for user #${metadata.userId}.`,
            );
            this.handleExecutionResult(
              message,
              metadata.userId,
              metadata.templateId,
            ).catch((e) =>
              console.error(
                `[ComfyUIService] Error in handleExecutionResult for prompt #${message.data.prompt_id}:`,
                e,
              ),
            );
            // 처리가 시작되면 Map에서 해당 항목 삭제 (재처리 방지)
            this.promptMetadata.delete(message.data.prompt_id);
          }
        }
      } catch (e) {
        console.error('Failed to parse message from ComfyUI WebSocket:', e);
      }
    };

    this.ws.onerror = (error) =>
      console.error('ComfyUI WebSocket error:', error);
    this.ws.onclose = (event) => {
      console.warn(
        `ComfyUI WebSocket disconnected: Code ${event.code}, Reason: ${event.reason}`,
      );
      setTimeout(() => this.connectToComfyUIWebSocket(), 5000);
    };
  }

  private createComfyUIRequest(workflow: ComfyUIInput): ComfyUIRequest {
    return {
      client_id: uuidv4(), // ✨ 각 프롬프트 요청마다 고유 ID 생성
      prompt: workflow,
    };
  }

  private getMimeType(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    switch (extension) {
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      case '.mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  }

  private async handleExecutionResult(
    message: ComfyUIWebSocketMessage,
    userId: number,
    templateId: number,
  ) {
    const messageData = message.data;
    if (!messageData.output?.images) return;

    const { prompt_id, output } = messageData;
    const finalImages = output.images.filter((img) => img.type === 'output');

    console.log(
      `[ComfyUIService] Handling execution result for prompt #${prompt_id}. Found ${finalImages.length} final images.`,
    );

    for (const imageInfo of finalImages) {
      try {
        const params = new URLSearchParams({
          filename: imageInfo.filename,
          type: imageInfo.type,
        });
        if (imageInfo.subfolder)
          params.append('subfolder', imageInfo.subfolder);
        const fileDownloadUrl = `${this.comfyuiUrl}/view?${params.toString()}`;

        console.log(
          `[ComfyUIService] Downloading file from: ${fileDownloadUrl}`,
        );
        const response = await axios.get(fileDownloadUrl, {
          responseType: 'arraybuffer',
          headers: { Authorization: this.authHeader },
        });
        const fileBuffer = Buffer.from(response.data);

        const r2FileName = `outputs/${userId}/${prompt_id}/${imageInfo.filename}`;
        const contentType = this.getMimeType(imageInfo.filename);
        const uploadedFileUrl = await this.storageService.uploadFile(
          r2FileName,
          fileBuffer,
          contentType,
        );

        console.log(
          `[ComfyUIService] Successfully uploaded to R2: ${uploadedFileUrl}`,
        );

        // TODO: DB에 생성 결과 저장하는 로직 구현
        // await this.generatedOutputService.create({ userId, promptId: prompt_id, workflowId: templateId, r2Url: uploadedFileUrl });
      } catch (error) {
        console.error(
          `[ComfyUIService] Failed to process and upload image ${imageInfo.filename} for prompt #${prompt_id}:`,
          error.message,
        );
      }
    }
  }

  async sendPromptToComfyUI(workflow: ComfyUIInput): Promise<ComfyUIResponse> {
    try {
      const requestPayload = this.createComfyUIRequest(workflow);
      const response = await axios.post(
        `${this.comfyuiUrl}/prompt`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authHeader,
          },
        },
      );
      return response.data as ComfyUIResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status =
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const errorData = error.response?.data as ComfyUIErrorResponseData;
        const message =
          typeof errorData === 'object' && errorData?.message
            ? errorData.message
            : 'ComfyUI API 호출 실패';
        throw new HttpException(
          { status, error: message, details: errorData },
          status,
        );
      } else {
        throw new InternalServerErrorException(
          'Internal Server Error during ComfyUI API call',
        );
      }
    }
  }

  async generateImageFromTemplate(
    generateDTO: GenerateImageDTO,
    adminUserId: number,
  ): Promise<ComfyUIResponse> {
    console.log(
      `[ComfyUIService] Admin #${adminUserId} requested image generation using templateId: ${generateDTO.templateId}`,
    );

    const template = await this.workflowService.findOneTemplateById(
      generateDTO.templateId,
    );
    const baseDefinition = template.definition as ComfyUIInput;
    const parameterMap = template.parameter_map;
    const modifiedDefinition: ComfyUIInput = JSON.parse(
      JSON.stringify(baseDefinition),
    );

    if (generateDTO.parameters && parameterMap) {
      // 파라미터 유효성 검사 및 적용 로직
      const unknownParams = Object.keys(generateDTO.parameters).filter(
        (p) => !Object.prototype.hasOwnProperty.call(parameterMap, p),
      );
      if (unknownParams.length > 0) {
        throw new HttpException(
          `Unknown parameters: ${unknownParams.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      for (const [paramKey, paramValue] of Object.entries(
        generateDTO.parameters,
      )) {
        const mappingInfo = parameterMap[paramKey];
        if (mappingInfo && modifiedDefinition[mappingInfo.node_id]?.inputs) {
          modifiedDefinition[mappingInfo.node_id].inputs[
            mappingInfo.input_name
          ] = paramValue;
        }
      }
    }

    // ✨ --- 동시성 문제 해결을 위한 변경점 3 --- ✨
    // WebSocket 리스너를 재등록하는 대신, prompt_id와 메타데이터를 Map에 저장
    try {
      const result = await this.sendPromptToComfyUI(modifiedDefinition);

      if (result && result.prompt_id) {
        this.promptMetadata.set(result.prompt_id, {
          userId: adminUserId,
          templateId: generateDTO.templateId,
        });
        console.log(
          `[ComfyUIService] Prompt #${result.prompt_id} metadata stored for user #${adminUserId}. Awaiting 'executed' message.`,
        );
      }

      return result;
    } catch (error) {
      console.error(
        `[ComfyUIService] Error during ComfyUI interaction for templateId ${generateDTO.templateId}:`,
        error.message,
      );
      throw error;
    }
  }
}
