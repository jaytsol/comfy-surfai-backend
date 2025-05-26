// src/comfyui/comfyui.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  ComfyUIInput,
  ComfyUIResponse,
} from './interfaces/comfyui-workflow.interface';
import { v4 as uuidv4 } from 'uuid';

export interface ComfyUIRequest {
  client_id: string;
  prompt: ComfyUIInput;
}

@Injectable()
export class ComfyuiService {
  private comfyuiUrl: string;
  private authHeader: string;

  constructor(private configService: ConfigService) {
    const comfyuiHost = this.configService.get<string>('COMFYUI_HOST');
    const username = this.configService.get<string>('NGINX_USERNAME');
    const password = this.configService.get<string>('NGINX_PASSWORD');

    // Nginx가 HTTPS로 프록시하므로 HTTPS URL 사용
    this.comfyuiUrl = `https://${comfyuiHost}`;
    this.authHeader =
      'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
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
