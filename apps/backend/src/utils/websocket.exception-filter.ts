import { WebSocketErrorResponse, WebsocketMessages } from '@monorepo/shared';
import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Socket } from 'socket.io';

interface ErrorInterface {
  message?: string;
  statusCode?: number;
  response?: {
    message?: string;
    error?: string;
    statusCode?: number;
  };
  cause?: number | string; //This is used to send custom error codes to the client
}

/**
 * This exception filters allows for the backend to throw regular http exceptions. 
 it then returns the error as a websocket message to the client
 */
@Catch(HttpException)
export class WebsocketExtensionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    const error = exception.getResponse() as ErrorInterface;
    console.log(error);

    console.log('getting here: ', JSON.stringify(error, null, 2));

    // Emit error only to the client who made a request
    const response: WebSocketErrorResponse = {
      clientId: client.id,
      message:
        error.message || error?.response?.message || 'unknown error occurred',
      statusCode:
        error?.cause || error?.statusCode || error?.response?.statusCode || 500, // INFO: this is the status code of the error
    };
    client.emit(WebsocketMessages.WEBSOCKET_ERROR, response);
  }
}
