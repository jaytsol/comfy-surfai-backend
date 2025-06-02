// src/comfyui/comfyui.service.ts
import {
  Injectable,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  ComfyUIInput, // 이미 정의된 타입 사용
  ComfyUIResponse, // 이미 정의된 타입 사용
  ComfyUIWebSocketMessage,
} from 'src/common/interfaces/comfyui-workflow.interface'; // 경로 확인
import { v4 as uuidv4 } from 'uuid';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { WorkflowService } from 'src/workflow/workflow.service'; // 이미 주입되어 있음
import { GenerateImageDTO } from 'src/common/dto/generate-image.dto';
// import { Workflow } from '../common/entities/workflow.entity'; // Workflow 엔티티는 WorkflowService가 다룸

// ComfyUIRequest 인터페이스는 이미 외부에 정의되어 있으므로 그대로 사용
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

  public readonly wsMessage$: EventEmitter<ComfyUIMessageEvents> = // 타입 명시 수정
    new EventEmitter();

  constructor(
    private readonly configService: ConfigService,
    private readonly workflowService: WorkflowService,
  ) {
    const comfyuiHost = this.configService.get<string>('COMFYUI_HOST');
    const username = this.configService.get<string>('NGINX_USERNAME');
    const password = this.configService.get<string>('NGINX_PASSWORD');

    this.comfyuiUrl = `https://${comfyuiHost}`;
    this.comfyuiWsUrl = `wss://${comfyuiHost}/ws`;
    this.authHeader =
      'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  }

  onModuleInit() {
    this.connectToComfyUIWebSocket();
  }

  // connectToComfyUIWebSocket, createComfyUIRequest 메소드는 기존 코드 그대로 유지...
  private connectToComfyUIWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('ComfyUI WebSocket is already connected.');
      return;
    }
    if (this.ws) {
      this.ws.close();
    }
    console.log(
      `Attempting to connect to ComfyUI WebSocket at: ${this.comfyuiWsUrl}`,
    );
    this.ws = new WebSocket(this.comfyuiWsUrl, {
      headers: { Authorization: this.authHeader },
    });
    this.ws.onopen = () =>
      console.log('Successfully connected to ComfyUI WebSocket');
    this.ws.onmessage = (event) => {
      try {
        let rawMessage: string;
        if (typeof event.data === 'string') rawMessage = event.data;
        else if (Buffer.isBuffer(event.data))
          rawMessage = event.data.toString('utf8');
        else if (event.data instanceof ArrayBuffer)
          rawMessage = Buffer.from(event.data).toString('utf8');
        else {
          console.warn(
            'Unexpected data type from ComfyUI WebSocket:',
            typeof event.data,
          );
          return;
        }
        const message = JSON.parse(rawMessage) as ComfyUIWebSocketMessage;
        this.wsMessage$.emit('message', message);
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
      client_id: uuidv4(),
      prompt: workflow,
    };
  }

  // 기존 sendPromptToComfyUI 메소드 (ComfyUIInput 타입을 받음)
  async sendPromptToComfyUI(workflow: ComfyUIInput): Promise<ComfyUIResponse> {
    try {
      const requestPayload = this.createComfyUIRequest(workflow);
      console.log(
        '[ComfyUIService] Sending HTTP POST to /prompt with client_id:',
        requestPayload.client_id,
      );
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
        const errorData = error.response?.data as ComfyUIErrorResponseData; // 타입 캐스팅
        const message =
          typeof errorData === 'object' && errorData?.message
            ? errorData.message
            : 'ComfyUI API 호출 실패';
        console.error(
          'ComfyUI API 호출 중 Axios 오류 발생:',
          `Status: ${status}`,
          `Message: ${message}`,
          'Details:',
          error.response?.data,
        );
        throw new HttpException(
          { status: status, error: message, details: errorData },
          status,
        );
      } else {
        console.error('ComfyUI API 호출 중 예상치 못한 오류 발생:', error);
        throw new HttpException(
          'Internal Server Error during ComfyUI API call',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  // ✨ --- 새로 추가될 메소드 --- ✨
  /**
   * 워크플로우 템플릿과 동적 파라미터를 사용하여 이미지를 생성합니다.
   * @param generateDTO templateId와 동적 파라미터 포함
   * @param adminUserId 요청을 보낸 관리자 ID (로깅 등에 사용)
   * @returns ComfyUI 처리 결과 (ComfyUIResponse 타입)
   */
  async generateImageFromTemplate(
    generateDTO: GenerateImageDTO,
    adminUserId: number,
  ): Promise<ComfyUIResponse> {
    // 반환 타입을 ComfyUIResponse로 명시
    console.log(
      `[ComfyUIService] Admin #${adminUserId} requested image generation using templateId: ${generateDTO.templateId} with parameters:`,
      generateDTO.parameters,
    );

    // 1. WorkflowService를 사용하여 템플릿 정보 가져오기
    //    findOneTemplateById는 템플릿이 없으면 NotFoundException을 던집니다.
    const template = await this.workflowService.findOneTemplateById(
      generateDTO.templateId,
    );

    // template.definition은 object 타입, ComfyUIInput 타입으로 간주 (필요시 유효성 검사 추가)
    const baseDefinition = template.definition as ComfyUIInput;
    const parameterMap = template.parameter_map;

    // 2. 원본 definition을 깊은 복사하여 수정 (원본 템플릿 변경 방지)
    const modifiedDefinition: ComfyUIInput = JSON.parse(
      JSON.stringify(baseDefinition),
    );

    // 3. 전달받은 parameters를 parameter_map을 참조하여 modifiedDefinition에 적용
    if (generateDTO.parameters && parameterMap) {
      // Validate parameters against parameterMap
      const unknownParams = Object.keys(generateDTO.parameters).filter(
        (paramKey) =>
          !Object.prototype.hasOwnProperty.call(parameterMap, paramKey),
      );

      if (unknownParams.length > 0) {
        throw new HttpException(
          `Unknown parameters found: ${unknownParams.join(', ')}. Valid parameters are: ${Object.keys(parameterMap).join(', ')}`,
          400,
        );
      }

      console.log(
        '[ComfyUIService] Applying dynamic parameters to workflow template:',
        generateDTO.parameters,
      );
      for (const paramKey in generateDTO.parameters) {
        if (
          Object.prototype.hasOwnProperty.call(generateDTO.parameters, paramKey)
        ) {
          const mappingInfo = parameterMap[paramKey]; // 예: { node_id: "6", input_name: "text" }
          const paramValue = generateDTO.parameters[paramKey];

          if (mappingInfo) {
            const { node_id, input_name } = mappingInfo;
            // 대상 노드 및 inputs 객체 존재 여부 확인
            if (
              modifiedDefinition[node_id] &&
              typeof modifiedDefinition[node_id] === 'object' &&
              modifiedDefinition[node_id].inputs
            ) {
              console.log(
                `  - Mapping parameter "${paramKey}" to Node ID "${node_id}", Input "${input_name}" with value:`,
                paramValue,
              );
              modifiedDefinition[node_id].inputs[input_name] = paramValue;
            } else {
              console.warn(
                `  - Warning: Node ID "${node_id}" (for param "${paramKey}") or its "inputs" property not found in the workflow definition. Skipping parameter application.`,
              );
            }
          } else {
            console.warn(
              `  - Warning: No mapping found for parameter "${paramKey}" in the template's parameter_map. This parameter will be ignored.`,
            );
          }
        }
      }
    } else if (generateDTO.parameters && !parameterMap) {
      console.warn(
        '[ComfyUIService] Parameters provided for generation, but the template has no parameter_map defined. Parameters will be ignored.',
      );
    } else {
      console.log(
        '[ComfyUIService] No dynamic parameters provided, or template has no parameter_map. Using base template definition.',
      );
    }

    // 4. 수정된 modifiedDefinition을 실제 ComfyUI로 전송 (기존 메소드 활용)
    console.log(
      '[ComfyUIService] Sending final modified workflow definition to ComfyUI.',
    );
    // console.log('[ComfyUIService] Workflow for ComfyUI:', JSON.stringify(modifiedDefinition, null, 2)); // 디버깅 시 전체 JSON 로깅

    try {
      // 기존에 구현된 sendPromptToComfyUI 메소드를 호출합니다.
      // 이 메소드는 ComfyUIInput 타입을 인자로 받으므로 modifiedDefinition을 그대로 전달합니다.
      const result = await this.sendPromptToComfyUI(modifiedDefinition);
      console.log(
        '[ComfyUIService] Successfully received response from ComfyUI for template-based generation.',
      );
      return result; // ComfyUIResponse 반환
    } catch (error) {
      // sendPromptToComfyUI 내부에서 이미 HttpException으로 변환하여 던지므로,
      // 여기서는 추가적인 로깅을 하거나 그대로 다시 던질 수 있습니다.
      console.error(
        `[ComfyUIService] Error during ComfyUI interaction for templateId ${generateDTO.templateId}:`,
        error.message,
      );
      // 에러는 이미 HttpException 형태일 것이므로 그대로 throw
      throw error;
    }
  }
}
