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
import { GenerateImageDTO } from 'src/common/dto/generate-image.dto';
import { IStorageService } from 'src/storage/interfaces/storage.interface';
import { getMimeType } from 'src/common/utils/mime-type.util';
import { GeneratedOutputService } from 'src/generated-output/generated-output.service';
import { CreateGeneratedOutputDTO } from 'src/common/dto/generated-output/create-generated-output.dto';
// --- 로컬 인터페이스 정의 ---
export interface ComfyUIRequest {
  client_id: string;
  prompt: ComfyUIInput;
}

interface ComfyUIErrorResponseData {
  message?: string;
}
// --- 인터페이스 정의 끝 ---

@Injectable()
export class ComfyUIService implements OnModuleInit {
  private comfyuiUrl: string;
  private comfyuiWsUrl: string;
  private authHeader: string;
  private ws: WebSocket;
  public readonly client_id: string; // WebSocket 연결 식별용, Comfyui.controller.ts에서 Response에 포함

  // ✨ prompt_id를 키로, 생성 요청의 전체 컨텍스트를 저장합니다.
  private readonly promptMetadata = new Map<
    string,
    {
      userId: number;
      templateId: number;
      parameters?: Record<string, any>; // 사용된 파라미터도 함께 저장
    }
  >();

  // EventsGateway가 구독할 EventEmitter
  public readonly wsMessage$: EventEmitter = new EventEmitter();

  constructor(
    private readonly configService: ConfigService,
    private readonly workflowService: WorkflowService,
    private readonly generatedOutputService: GeneratedOutputService,
    @Inject('IStorageService') private readonly storageService: IStorageService,
  ) {
    const comfyuiHost = this.configService.get<string>('COMFYUI_HOST');
    const username = this.configService.get<string>('NGINX_USERNAME');
    const password = this.configService.get<string>('NGINX_PASSWORD');

    this.client_id = uuidv4();
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

    // WebSocket 메시지 핸들러 (서비스 초기화 시 한 번만 등록)
    this.ws.onmessage = (event) => {
      try {
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

        const message = JSON.parse(rawMessage) as ComfyUIWebSocketMessage;

        // 1. 모든 메시지를 EventsGateway로 전달하여 프론트엔드로 브로드캐스트
        this.wsMessage$.emit('message', message);

        // 2. 'executed' 메시지인 경우, R2 업로드 등 후처리 작업 수행
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
              metadata.parameters,
            ).catch((e) =>
              console.error(
                `[ComfyUIService] Error in handleExecutionResult for prompt #${message.data.prompt_id}:`,
                e,
              ),
            );
            // 후처리 시작 후 Map에서 해당 항목 삭제 (재처리 방지)
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

  private async handleExecutionResult(
    message: ComfyUIWebSocketMessage,
    userId: number,
    templateId: number,
    usedParameters?: Record<string, any>,
  ) {
    const messageData = message.data;
    if (!messageData.output?.images) return;

    const { prompt_id, output } = messageData;
    const finalImages = output.images.filter((img) => img.type === 'output');
    console.log(
      `[ComfyUIService] Handling execution result for prompt #${prompt_id}. Found ${finalImages.length} final images.`,
    );

    const uploadAndSavePromises = finalImages.map(async (imageInfo) => {
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
        const contentType = getMimeType(imageInfo.filename);
        const uploadedFileUrl = await this.storageService.uploadFile(
          r2FileName,
          fileBuffer,
          contentType,
        );

        console.log(
          `[ComfyUIService] Successfully uploaded to R2: ${uploadedFileUrl}`,
        );

        // ✨ --- DB에 생성 결과 저장하는 로직 구현 --- ✨
        const createOutputDTO: CreateGeneratedOutputDTO = {
          r2Url: uploadedFileUrl,
          originalFilename: imageInfo.filename,
          mimeType: contentType,
          promptId: prompt_id,
          ownerUserId: userId,
          sourceWorkflowId: templateId,
          usedParameters: usedParameters, // 사용된 파라미터 함께 저장
        };
        return await this.generatedOutputService.create(createOutputDTO);
      } catch (error) {
        console.error(
          `[ComfyUIService] Failed to process and upload image ${imageInfo.filename} for prompt #${prompt_id}:`,
          error.message,
        );
        return null; // 실패 시 null 반환
      }
    });

    const successfulOutputs = (await Promise.all(uploadAndSavePromises)).filter(
      (output) => !!output,
    );

    if (successfulOutputs.length > 0) {
      // ✨ 컨트롤러의 DTO 매핑 함수를 재사용하거나 유사한 로직으로,
      //    엔티티를 프론트엔드가 사용할 DTO (HistoryItemData와 유사한 구조)로 변환합니다.
      const outputsForFrontend = await Promise.all(
        successfulOutputs.map(async (output) => {
          const r2Key = new URL(output.r2Url).pathname.substring(1);
          const viewUrl = await this.storageService.getSignedUrl(r2Key, {
            expiresIn: 3600,
          });
          return {
            id: output.id,
            viewUrl: viewUrl,
            originalFilename: output.originalFilename,
            createdAt: output.createdAt.toISOString(),
            usedParameters: output.usedParameters,
          };
        }),
      );

      const resultPayload = {
        prompt_id: prompt_id,
        outputs: outputsForFrontend, // ✨ 풍부한 정보가 담긴 객체 배열 전달
      };

      this.wsMessage$.emit('generation_result', {
        type: 'generation_result',
        data: resultPayload,
      });
      console.log(
        `[ComfyUIService] Emitting 'generation_result' for prompt #${prompt_id}`,
      );
    }
  }

  private createComfyUIRequest(workflow: ComfyUIInput): ComfyUIRequest {
    // WebSocket 연결과 동일한 client_id를 사용하여 HTTP 요청과 WebSocket 세션을 연결
    return {
      client_id: this.client_id,
      prompt: workflow,
    };
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
      const unknownParams = Object.keys(generateDTO.parameters).filter(
        (p) => !Object.hasOwn(parameterMap, p),
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

    try {
      const result = await this.sendPromptToComfyUI(modifiedDefinition);

      if (result && result.prompt_id) {
        // ✨ prompt_id와 요청 메타데이터를 Map에 저장하여 나중에 WebSocket 메시지 처리 시 사용
        this.promptMetadata.set(result.prompt_id, {
          userId: adminUserId,
          templateId: generateDTO.templateId,
          parameters: generateDTO.parameters,
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
}
