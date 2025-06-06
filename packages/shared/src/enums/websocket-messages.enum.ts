export const WebsocketEvents = {
  UPDATE_DRIVER_LOCATION: "UPDATE_DRIVER_LOCATION",
  WEBSOCKET_ERROR: "WEBSOCKET_ERROR",
  /** REALTIME */
  SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE: "SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE",
  UNSUBSCRIBE_FROM_DRIVER_LOCATION_UPDATE: "UNSUBSCRIBE_FROM_DRIVER_LOCATION_UPDATE",
  /** EVERY FIVE SECONDS */
  SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS: "SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS",
  UNSUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS: "UNSUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS",

  OFFLINE_DRIVER: "OFFLINE_DRIVER",
  DRIVER_DETAILS_AND_LOCATION_RESPONSE: "DRIVER_DETAILS_AND_LOCATION_RESPONSE",

} as const;

export type WebsocketEventKey = keyof typeof WebsocketEvents;
export type WebsocketEventType = typeof WebsocketEvents[WebsocketEventKey];
