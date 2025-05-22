import type { WebSocketRequest } from "@monorepo/shared";
import type { Socket } from "socket.io-client";

export const generateRandomCoordinates = () => {
  const latitude = Math.random() * 180 - 90;
  const longitude = Math.random() * 360 - 180;
  return { latitude, longitude }
}
export function sendMessage<T>(socket: Socket, event: string, token: string, payload: T) {
  const p: WebSocketRequest<unknown> = {
    token,
    payload,
  };
  socket.emit(event, JSON.stringify(p));
}