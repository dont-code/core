import { Change } from '@dontcode/core';

/**
 * Description of a message exchanged between the components (client, services)
 * It can be an INIT with the sessionId requested or given
 * Or a CHANGE with the sessionId and Change
 */
export class Message {
  type: MessageType;
  sessionId?: string;
  change?: Change;

  constructor(type: MessageType, sessionId?: string, change?: Change) {
    this.type = type;
    this.sessionId = sessionId;
    this.change = change;
  }
}

export enum MessageType {
  INIT = 'INIT',
  CHANGE = 'CHANGE',
}
