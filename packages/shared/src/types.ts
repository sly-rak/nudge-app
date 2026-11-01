export type AgeTier = '13_17' | '18_plus';
export type AvatarKind = 'initials' | 'image' | 'video';
export type DownForStatus = 'talk' | 'play' | 'hang' | 'heads_down';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  avatarKind: AvatarKind;
  ageTier: AgeTier;
  createdAt: string;
  status?: UserStatus;
}

export interface UserStatus {
  downFor: DownForStatus;
  text?: string;
  expiresAt?: string;
}

export interface UserSettings {
  lastSeenVisibility: 'everyone' | 'friends' | 'nobody';
  onlineVisibility: 'everyone' | 'friends' | 'nobody';
  photoVisibility: 'everyone' | 'friends' | 'nobody';
  readReceipts: boolean;
  typingIndicators: boolean;
  storyAudienceDefault: 'public' | 'friends' | 'close';
}

export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  avatarUrl?: string;
  directKey?: string;
  lastSeq: number;
  lastMessageAt: string;
  createdAt: string;
  lastMessage?: Message;
  unreadCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  disappearingSeconds?: number;
  members?: ConversationMember[];
}

export interface ConversationMember {
  conversationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastDeliveredSeq: number;
  lastReadSeq: number;
  user?: User;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'game'
  | 'system';

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  seq: number;
  senderId: string;
  clientMsgId?: string;
  type: MessageType;
  body: string;
  mediaUrl?: string;
  replyToId?: string;
  replyTo?: Message;
  editedAt?: string;
  deletedAt?: string;
  expiresAt?: string;
  vanishAfterRead?: boolean;
  createdAt: string;
  reactions?: MessageReaction[];
  sender?: User;
}

export interface Story {
  id: string;
  authorId: string;
  type: 'text' | 'photo' | 'video' | 'poll';
  mediaUrl?: string;
  text?: string;
  background?: string;
  audience: 'public' | 'friends' | 'close';
  expiresAt: string;
  createdAt: string;
  author?: User;
  hasViewed?: boolean;
  reactionsCount?: number;
}

export interface GameSession {
  id: string;
  gameKey: 'tictactoe' | 'connect4' | 'wordguess';
  conversationId?: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
  state: Record<string, any>;
  version: number;
  turnUserId?: string;
  createdBy: string;
  winnerId?: string;
  createdAt: string;
  updatedAt: string;
  players?: User[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
