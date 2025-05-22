import type { WebsocketEventType, WebSocketRequest } from "@monorepo/shared";
import type { Socket } from "socket.io-client";

export class AppSocket {
  socket: Socket;
  token: string;
  constructor(socket: Socket, token: string) {
    this.socket = socket;
    this.token = token;
  }
  send<T, RT>(event: WebsocketEventType, payload: T) {
    const p: WebSocketRequest<unknown> = {
      token: this.token,
      payload,
    };
    return new Promise((resolve) => {
      this.socket.emit(event, JSON.stringify(p), (response: RT) => resolve(response));
    })
  }
  on<T>(event: WebsocketEventType) {
    return new Promise<T>((resolve) => {
      this.socket.on(event, (response: T) => {
        resolve(response)
      })
    })
  }
}
