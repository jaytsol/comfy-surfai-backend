// src/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  // SubscribeMessage, // SubscribeMessage는 여전히 사용할 수 있지만, 메시지 형식은 JSON 문자열로 가정
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server as WsServer, WebSocket } from 'ws'; // ws 라이브러리의 Server와 WebSocket 임포트
import { ComfyUIService } from 'src/comfyui/comfyui.service';
import { ComfyUIWebSocketMessage } from 'src/common/interfaces/comfyui-workflow.interface';
import { URLSearchParams } from 'url'; // URLSearchParams 임포트

// port: 3000 -> 이 게이트웨이는 3000번 포트에서 별도의 WebSocket 서버를 실행합니다.
// HTTP 서버(main.ts에서 설정한 포트)와는 별개입니다.
// CORS 옵션은 WsAdapter에서는 @WebSocketGateway 데코레이터에서 직접 적용되지 않을 수 있습니다.
// 필요한 경우 HTTP 업그레이드 요청에 대한 CORS 설정을 NestJS의 main CORS 설정에서 다뤄야 할 수 있습니다.
@WebSocketGateway({
  path: '/generate', // 필요시 경로 지정 (예: ws://localhost:3000/events)
})
export class EventsGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: WsServer; // 타입 변경: ws.Server

  constructor(private comfyuiService: ComfyUIService) {}

  onModuleInit() {
    console.log(
      'EventsGateway (Native WebSocket) initialized. Subscribing to ComfyUIService messages...',
    );
    this.comfyuiService.wsMessage$.on(
      'message',
      (message: ComfyUIWebSocketMessage) => {
        // 모든 연결된 네이티브 WebSocket 클라이언트에게 메시지 브로드캐스트
        this.server.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(JSON.stringify(message)); // 메시지를 JSON 문자열로 변환하여 전송
            } catch (error) {
              console.error(
                'Failed to send message to a native WebSocket client:',
                error,
              );
            }
          }
        });
      },
    );
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    const request = args[0]; // HTTP 요청 객체 (업그레이드 요청 시)
    const clientConnectionString = request.url; // 예: "/?clientId=some-id" 또는 "/events?clientId=some-id"

    let clientId = 'N/A';
    if (clientConnectionString) {
      const queryString = clientConnectionString.split('?')[1];
      if (queryString) {
        const params = new URLSearchParams(queryString);
        clientId = params.get('clientId') || 'N/A';
      }
    }

    console.log(`Native WebSocket Client connected: ID - ${clientId}`);
    // 필요하다면 client 객체에 clientId를 저장하거나, Map 등으로 관리할 수 있습니다.
    // (client as any).clientId = clientId;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDisconnect(client: WebSocket) {
    // const clientId = (client as any).clientId || 'N/A';
    console.log(`Native WebSocket Client disconnected.`);
  }

  // @SubscribeMessage 데코레이터를 사용하여 클라이언트로부터 메시지를 받을 수도 있습니다.
  // 예: 클라이언트가 ws.send(JSON.stringify({ event: 'myEvent', data: 'hello' }))를 보낸 경우
  /*
  @SubscribeMessage('myEvent')
  handleMyEvent(client: WebSocket, data: any): string {
    console.log('Received myEvent from client:', data);
    return JSON.stringify({ event: 'myEventResponse', data: 'got it!' }); // 응답도 JSON 문자열로
  }
  */
}
