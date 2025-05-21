export interface WebSocketRequest<T> {
  token: string;
  payload: T
}

export interface WebSocketErrorResponse {
  clientId: string;
  message: string;
  statusCode: number | string;
}