import { Message, Conversation, UserStatus } from './types.js';

export type RealtimeServerEvent =
  | { t: 'authenticated'; d: { userId: string } }
  | { t: 'message.new'; d: { conversationId: string; roomId?: string; message: Message } }
  | { t: 'message.updated'; d: { conversationId: string; message: Message } }
  | { t: 'message.deleted'; d: { conversationId: string; messageId: string } }
  | { t: 'message.status'; d: { conversationId: string; lastDeliveredSeq: number; lastReadSeq: number } }
  | { t: 'conversation.updated'; d: { conversationId: string; conversation?: Partial<Conversation>; disappearSeconds?: number; pinnedMessageId?: string | null } }
  | { t: 'conversation.cleared'; d: { conversationId: string } }
  | { t: 'typing'; d: { conversationId: string; userId: string; isTyping: boolean } }
  | { t: 'presence'; d: { userId: string; isOnline: boolean; lastSeenAt?: string; status?: UserStatus } }
  | { t: 'game.state'; d: { sessionId: string; state: Record<string, any>; turnUserId?: string; winnerId?: string; status: string } }
  | { t: 'error'; d: { code: string; message: string } };

export type RealtimeClientEvent =
  | { t: 'message.send'; d: { conversationId: string; roomId?: string; body: string; type?: string; mediaUrl?: string; replyToId?: string; clientMsgId: string } }
  | { t: 'conversation.read'; d: { conversationId: string; seq: number } }
  | { t: 'typing.start'; d: { conversationId: string } }
  | { t: 'typing.stop'; d: { conversationId: string } }
  | { t: 'game.move'; d: { sessionId: string; move: Record<string, any> } }
  | { t: 'presence.set'; d: { status?: UserStatus } };

export interface RealtimeEnvelope<T> {
  t: string;
  id?: string;
  ts?: string;
  d: T;
  ref?: string;
}
