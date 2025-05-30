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
  ComfyUIInput,
  ComfyUIResponse,
  ComfyUIWebSocketMessage,
} from 'src/common/interfaces/comfyui-workflow.interface';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

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
export class ComfyuiService implements OnModuleInit {
  private comfyuiUrl: string;
  private comfyuiWsUrl: string;
  private authHeader: string;
  private ws: WebSocket;

  // ComfyUI WebSocket 메시지를 외부로 발행하기 위한 EventEmitter 인스턴스
  // 'message'라는 이벤트 이름으로 ComfyUIWebSocketMessage 타입의 데이터를 전달합니다.
  public readonly wsMessage$: EventEmitter<ComfyUIMessageEvents> =
    new EventEmitter();

  constructor(private configService: ConfigService) {
    const comfyuiHost = this.configService.get<string>('COMFYUI_HOST');
    const username = this.configService.get<string>('NGINX_USERNAME');
    const password = this.configService.get<string>('NGINX_PASSWORD');

    // Nginx가 HTTPS로 프록시하므로 HTTPS URL 사용
    this.comfyuiUrl = `https://${comfyuiHost}`;
    this.comfyuiWsUrl = `wss://${comfyuiHost}/ws`;
    this.authHeader =
      'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  }

  onModuleInit() {
    this.connectToComfyUIWebSocket();
  }

  private connectToComfyUIWebSocket() {
    // 이미 연결이 열려있는 경우, 불필요한 재연결 시도 방지
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('ComfyUI WebSocket is already connected.');
      return;
    }
    // 기존 연결이 있다면 명확히 종료
    if (this.ws) {
      this.ws.close();
    }

    console.log(
      `Attempting to connect to ComfyUI WebSocket at: ${this.comfyuiWsUrl}`,
    );

    this.ws = new WebSocket(this.comfyuiWsUrl, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    this.ws.onopen = () => {
      console.log('Successfully connected to ComfyUI WebSocket');
    };

    this.ws.onmessage = (event) => {
      try {
        let rawMessage: string;

        // event.data의 타입을 확인하여 안전하게 문자열로 변환
        if (typeof event.data === 'string') {
          rawMessage = event.data;
        } else if (Buffer.isBuffer(event.data)) {
          // Buffer인 경우 UTF-8로 변환 (JSON은 일반적으로 UTF-8)
          rawMessage = event.data.toString('utf8');
        } else if (event.data instanceof ArrayBuffer) {
          // ArrayBuffer인 경우 Buffer로 변환 후 문자열로 변환
          rawMessage = Buffer.from(event.data).toString('utf8');
        } else {
          // 예상치 못한 다른 타입 (예: Buffer[] 등)
          console.warn(
            'Unexpected data type received from ComfyUI WebSocket:',
            typeof event.data,
            event.data,
          );
          return; // 이 메시지는 처리하지 않고 넘어갑니다.
        }

        const message = JSON.parse(rawMessage) as ComfyUIWebSocketMessage;
        // console.log('Received message from ComfyUI WebSocket:', message);
        this.wsMessage$.emit('message', message);
      } catch (e) {
        console.error('Failed to parse message from ComfyUI WebSocket:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('ComfyUI WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      console.warn(
        `ComfyUI WebSocket disconnected: Code ${event.code}, Reason: ${event.reason}`,
      );
      // 연결 종료 시 5초 후 재연결 시도
      setTimeout(() => {
        console.log('Attempting to reconnect to ComfyUI WebSocket...');
        this.connectToComfyUIWebSocket();
      }, 5000);
    };
  }

  private createComfyUIRequest(workflow: ComfyUIInput): ComfyUIRequest {
    return {
      client_id: uuidv4(),
      prompt: workflow,
    };
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
      // Axios 에러인 경우
      if (axios.isAxiosError(error)) {
        const status =
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const errorData = error.response?.data as ComfyUIErrorResponseData;
        const message = errorData.message || 'ComfyUI API 호출 실패';
        console.error(
          'ComfyUI API 호출 중 Axios 오류 발생:',
          `Status: ${status}`,
          `Message: ${message}`,
          'Details:',
          error.response?.data,
        );
        throw new HttpException(
          {
            status: status,
            error: message,
            details: error.response?.data as ComfyUIErrorResponseData,
          },
          status,
        );
      } else {
        // 기타 예상치 못한 에러
        console.error('ComfyUI API 호출 중 예상치 못한 오류 발생:', error);
        throw new HttpException(
          'Internal Server Error during ComfyUI API call',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
