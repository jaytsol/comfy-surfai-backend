import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { URLSearchParams } from 'url';
import { ComfyUIService } from 'src/comfyui/comfyui.service';
import {
  ComfyUIWebSocketMessage,
  GenerationResult,
} from '../interfaces/comfyui-workflow.interface';
import { OnModuleInit, Logger } from '@nestjs/common';

@WebSocketGateway({
  path: '/generate',
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');
  private latestComfyUIStatus: string = 'OFFLINE';

  constructor(private readonly comfyuiService: ComfyUIService) {}

  onModuleInit() {
    this.logger.log('Initialized. Subscribing to ComfyUIService events.');

    this.comfyuiService.wsMessage$.on(
      'message',
      (message: ComfyUIWebSocketMessage) => {
        this.broadcast(message);
      },
    );

    this.comfyuiService.wsMessage$.on(
      'generation_result',
      (payload: { type: string; data: GenerationResult }) => {
        this.logger.log(
          `Broadcasting 'generation_result' for prompt #${payload.data.prompt_id}`,
        );
        this.broadcast(payload);
      },
    );

    this.comfyuiService.wsMessage$.on('status', (status: string) => {
      this.logger.log(`ComfyUI status changed to: ${status}`);
      this.latestComfyUIStatus = status;
      this.broadcast({ type: 'comfyui_status_update', data: { status } });
    });
  }

  private broadcast(message: any) {
    const messageString = JSON.stringify(message);
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageString);
        } catch (error) {
          this.logger.error(
            'Failed to send message to a WebSocket client:',
            error,
          );
        }
      }
    });
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    const request = args[0];
    const clientConnectionString = request.url;
    let clientId = 'unknown';

    if (clientConnectionString) {
      const queryString = clientConnectionString.split('?')[1];
      if (queryString) {
        const params = new URLSearchParams(queryString);
        clientId = params.get('clientId') || 'unknown';
      }
    }
    this.logger.log(`Client connected: ${clientId}`);

    // Send the latest known status to the newly connected client
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: 'comfyui_status_update',
          data: { status: this.latestComfyUIStatus },
        }),
      );
    }
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('A client disconnected.');
  }
}
