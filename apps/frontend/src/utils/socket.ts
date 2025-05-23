import type { WebsocketEventType, WebSocketRequest } from "@monorepo/shared";
import type { Socket } from "socket.io-client";

export class AppSocket {
  socket: Socket;
  token: string;

  constructor(socket: Socket, token: string) {
    this.socket = socket;
    this.token = token;
  }

  emit<T, RT>(event: WebsocketEventType, payload: T): Promise<RT> {
    const p: WebSocketRequest<T> = {
      token: this.token,
      payload,
    };
    return new Promise<RT>((resolve) => {
      this.socket.emit(event, JSON.stringify(p), (response: RT) => resolve(response));
    });
  }

  on<T>(event: WebsocketEventType, handler: (response: T) => void): void {
    this.socket.on(event, handler);
  }

  off<T>(event: WebsocketEventType, handler?: (response: T) => void): void {
    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.removeAllListeners(event);
    }
  }
}

