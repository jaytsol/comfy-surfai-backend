import {
  WebSocketGateway,
  WebSocketServer,
  // SubscribeMessage,
  // MessageBody,
} from '@nestjs/websockets';

import { OnModuleInit } from '@nestjs/common';
import { Server, WebSocket } from 'ws';

import { ComfyUIService } from 'src/comfyui/comfyui.service';
import { ComfyUIWebSocketMessage } from 'src/common/interfaces/comfyui-workflow.interface';

@WebSocketGateway({ cors: true, port: 4000 })
export class EventsGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private comfyuiService: ComfyUIService) {}

  onModuleInit() {
    console.log(
      'EventsGateway initialized. Subscribing to ComfyUIService messages...',
    );
    this.comfyuiService.wsMessage$.on(
      'message',
      (message: ComfyUIWebSocketMessage) => {
        console.log(
          'Received ComfyUI WebSocket message in EventsGateway:',
          message,
        );
        this.server.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      },
    );
  }
}
