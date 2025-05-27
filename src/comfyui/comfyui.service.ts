// src/comfyui/comfyui.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  ComfyUIInput,
  ComfyUIResponse,
  ComfyUIWebSocketMessage,
} from './interfaces/comfyui-workflow.interface';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket } from 'ws';

export interface ComfyUIRequest {
  client_id: string;
  prompt: ComfyUIInput;
}

@Injectable()
export class ComfyuiService implements OnModuleInit {
  private comfyuiUrl: string;
  private comfyuiWsUrl: string;
  private authHeader: string;
  private ws: WebSocket;

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
    if (this.ws) {
      this.ws.close();
    }
    this.ws = new WebSocket(this.comfyuiWsUrl, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    this.ws.onopen = () => {
      console.log('Connected to ComfyUI WebSocket');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(
          event.data as string,
        ) as ComfyUIWebSocketMessage;
        console.log('Received message from ComfyUI WebSocket:', message);
      } catch (e) {
        console.error('Failed to parse message from ComfyUI WebSocket:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Reconnect after error
      setTimeout(() => this.connectToComfyUIWebSocket(), 5000);
    };

    this.ws.onclose = (event) => {
      console.error(
        `Disconnected from ComfyUI WebSocket: ${event.code} - ${event.reason}`,
      );

      setTimeout(() => {
        console.log('Reconnecting to ComfyUI WebSocket...');
        this.connectToComfyUIWebSocket();
      }, 5000);
    };
  }

  public onWebSocketMessage(
    callback: (message: ComfyUIWebSocketMessage) => void,
  ) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(
            event.data as string,
          ) as ComfyUIWebSocketMessage;
          console.log('Received message from ComfyUI WebSocket:', message);
          callback(message);
        } catch (e) {
          console.error('Failed to parse message from ComfyUI WebSocket:', e);
        }
      };
    }
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
      console.error('ComfyUI API 호출 중 오류 발생:', error);
      throw error;
    }
  }
}
