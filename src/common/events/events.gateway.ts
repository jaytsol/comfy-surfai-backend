import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws'; // ws 라이브러리 임포트
import { URLSearchParams } from 'url';
import { ComfyUIService } from 'src/comfyui/comfyui.service';
import {
  ComfyUIWebSocketMessage,
  GenerationResult,
} from '../interfaces/comfyui-workflow.interface';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  path: '/generate', // 프론트엔드의 WEBSOCKET_SERVER_URL 경로와 일치시켜야 합니다.
  // NestJS 8 이상에서는 path가 기본적으로 /socket.io/ 이므로, ws 어댑터 사용 시
  // main.ts에서 어댑터를 설정하거나, 경로를 명확히 해야 할 수 있습니다.
  // 프론트에서 `wss://.../events`로 연결한다면 여기에 맞게 설정합니다.
  cors: {
    origin: '*', // 또는 프론트엔드 주소: 'http://localhost:4000' 등
    // credentials: true, // 필요하다면
  },
})
export class EventsGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server; // ws의 Server 타입

  // 현재 연결된 클라이언트들을 관리할 수 있습니다 (선택 사항)
  // private clients = new Map<string, WebSocket>();

  constructor(private readonly comfyuiService: ComfyUIService) {}

  /**
   * 게이트웨이가 초기화될 때 실행됩니다.
   * ComfyUIService에서 발생하는 이벤트를 구독하는 로직을 여기에 배치합니다.
   */
  onModuleInit() {
    console.log(
      '[EventsGateway] Initialized. Subscribing to ComfyUIService events.',
    );

    // 1. ComfyUI로부터 받은 원본 메시지를 구독하여 클라이언트로 전달
    this.comfyuiService.wsMessage$.on(
      'message',
      (message: ComfyUIWebSocketMessage) => {
        // console.log(`[EventsGateway] Broadcasting 'message' event:`, message.type);
        this.broadcast(message); // 받은 메시지 그대로 브로드캐스트
      },
    );

    // 2. 백엔드가 생성한 최종 결과 메시지를 구독하여 클라이언트로 전달
    this.comfyuiService.wsMessage$.on(
      'generation_result',
      (payload: { type: string; data: GenerationResult }) => {
        console.log(
          `[EventsGateway] Broadcasting 'generation_result' event for prompt #${payload.data.prompt_id}`,
        );
        this.broadcast(payload); // payload 객체({ type, data }) 그대로 브로드캐스트
      },
    );
  }

  /**
   * 연결된 모든 클라이언트에게 메시지를 전송(브로드캐스트)하는 헬퍼 메소드
   * @param message 전송할 메시지 객체
   */
  private broadcast(message: any) {
    const messageString = JSON.stringify(message);
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageString);
        } catch (error) {
          console.error('Failed to send message to a WebSocket client:', error);
        }
      }
    });
  }

  /**
   * 새로운 클라이언트가 연결되었을 때 실행됩니다.
   */
  handleConnection(client: WebSocket, ...args: any[]) {
    const request = args[0];
    const clientConnectionString = request.url; // 예: "/events?clientId=some-id"
    let clientId = 'unknown';

    if (clientConnectionString) {
      const queryString = clientConnectionString.split('?')[1];
      if (queryString) {
        const params = new URLSearchParams(queryString);
        clientId = params.get('clientId') || 'unknown';
      }
    }
    console.log(`[EventsGateway] Client connected: ${clientId}`);
    // this.clients.set(clientId, client); // 특정 클라이언트에게만 메시지를 보낼 경우를 대비해 저장
  }

  /**
   * 클라이언트 연결이 끊어졌을 때 실행됩니다.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDisconnect(client: WebSocket) {
    // const clientId = ...; // Map에서 해당 클라이언트를 찾아 ID를 얻고 Map에서 제거하는 로직
    console.log('[EventsGateway] A client disconnected.');
  }
}
