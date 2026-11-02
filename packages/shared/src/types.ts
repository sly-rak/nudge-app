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
  isBot?: boolean;
  botPersona?: {
    tone?: string;
    relationship?: string;
    autoReply?: boolean;
    interests?: string[];
    replyDelayMs?: number;
  };
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

export interface Room {
  id: string;
  conversationId: string;
  name: string;
  emoji?: string;
  adminOnly?: boolean;
  archived?: boolean;
  createdAt?: string;
  unreadCount?: number;
}

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
  disappearSeconds?: number;
  endsAt?: string;
  archivedAt?: string;
  pinnedMessageId?: string;
  pinnedMessage?: Message;
  rooms?: Room[];
  activeRoomId?: string;
  members?: ConversationMember[];
  permissions?: { info?: boolean; send?: boolean; add?: boolean };
  customTheme?: { accent?: string; wallpaper?: any; tone?: string; dim?: number; isShared?: boolean };
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
  | 'voice'
  | 'file'
  | 'gif'
  | 'sticker'
  | 'game'
  | 'system';

export interface MediaMetadata {
  name?: string;
  size?: number;
  mime?: string;
  dur?: number;
  wave?: number[];
  url?: string;
  sim?: boolean;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  roomId?: string;
  seq: number;
  senderId: string;
  clientMsgId?: string;
  type: MessageType;
  body: string;
  mediaUrl?: string;
  mediaMetadata?: MediaMetadata;
  replyToId?: string;
  replyTo?: Partial<Message>;
  editedAt?: string;
  deletedAt?: string;
  expiresAt?: string;
  vanishAfterRead?: boolean;
  vanishSeconds?: number;
  isStarred?: boolean;
  isPinned?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  readAt?: string;
  createdAt: string;
  reactions?: MessageReaction[];
  sender?: Partial<User>;
}

export interface StoryPollOption {
  t: string;
  v: string[]; // array of userIds who voted
}

export interface StoryPollData {
  q: string;
  opts: StoryPollOption[];
}

export interface StoryQAAnswer {
  by: string; // userId or displayName
  text: string;
  t: number;
}

export interface StoryQAData {
  q: string;
  answers: StoryQAAnswer[];
}

export interface StoryData {
  poll?: StoryPollData;
  qa?: StoryQAData;
  music?: {
    title: string;
    artist: string;
    url?: string;
  };
}

export interface Story {
  id: string;
  authorId: string;
  type: 'text' | 'photo' | 'video' | 'poll' | 'qa' | 'music';
  mediaUrl?: string;
  text?: string;
  background?: string;
  audience: 'public' | 'friends' | 'close';
  data?: StoryData;
  expiresAt: string;
  createdAt: string;
  author?: User;
  hasViewed?: boolean;
  reactionsCount?: number;
  viewsCount?: number;
}

export interface BotMemory {
  id: string;
  botId: string;
  userId: string;
  memoryKey: string;
  memoryValue: string;
  interactionsCount: number;
  updatedAt: string;
}

export interface GameSession {
  id: string;
  gameKey: 'tictactoe' | 'connect4' | 'wordguess' | 'rps' | string;
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
