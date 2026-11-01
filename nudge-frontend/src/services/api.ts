import { User, Conversation, Message, Story, GameSession, UserStatus, Room } from '@nudge/shared';

const API_BASE = '/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('nudge_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('nudge_token', token);
    } else {
      localStorage.removeItem('nudge_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(identifier: string, password: string) {
    const res = await this.request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(res.accessToken);
    return res;
  }

  async register(data: { email: string; username: string; displayName: string; password: string; dateOfBirth?: string }) {
    const res = await this.request<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.accessToken);
    return res;
  }

  async getMe() {
    return this.request<{ user: User }>('/auth/me');
  }

  async getDemoAccounts() {
    return this.request<{ accounts: any[] }>('/auth/demo-accounts');
  }

  async demoLogin(userId: string) {
    const res = await this.request<{ user: User; accessToken: string }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    this.setToken(res.accessToken);
    return res;
  }

  // Users & Profile
  async searchUsers(query: string) {
    return this.request<{ users: any[] }>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async updateProfile(data: { displayName?: string; bio?: string; avatarUrl?: string }) {
    return this.request<{ user: User }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateStatus(status: UserStatus) {
    return this.request<{ status: UserStatus }>('/users/me/status', {
      method: 'PUT',
      body: JSON.stringify(status),
    });
  }

  async getSettings() {
    return this.request<{ settings: any }>('/users/me/settings');
  }

  async updateSettings(settings: any) {
    return this.request<{ settings: any }>('/users/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // Friends
  async getFriends() {
    return this.request<{ friends: any[] }>('/friends');
  }

  async sendFriendRequest(targetUserId: string) {
    return this.request<{ success: boolean }>('/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  }

  // Chat & Messaging
  async getConversations() {
    return this.request<{ conversations: Conversation[] }>('/conversations');
  }

  async createConversation(data: {
    type: 'direct' | 'group';
    targetUserId?: string;
    title?: string;
    memberIds?: string[];
    endsAt?: string | null;
    rooms?: { name: string; emoji?: string }[];
  }) {
    return this.request<{ conversationId: string }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessages(conversationId: string, roomId?: string) {
    const q = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
    return this.request<{ messages: Message[] }>(`/conversations/${conversationId}/messages${q}`);
  }

  async sendMessage(
    conversationId: string,
    data: {
      body: string;
      type?: string;
      mediaUrl?: string;
      replyToId?: string;
      clientMsgId?: string;
      roomId?: string;
    }
  ) {
    return this.request<{ message: Message }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addRoom(conversationId: string, room: { name: string; emoji?: string; adminOnly?: boolean }) {
    return this.request<{ room: Room }>(`/conversations/${conversationId}/rooms`, {
      method: 'POST',
      body: JSON.stringify(room),
    });
  }

  async updateExpiration(conversationId: string, endsAt: string | null) {
    return this.request<{ conversation: any }>(`/conversations/${conversationId}/expiration`, {
      method: 'PATCH',
      body: JSON.stringify({ endsAt }),
    });
  }

  async archiveConversation(conversationId: string) {
    return this.request<{ success: boolean }>(`/conversations/${conversationId}/archive`, {
      method: 'POST',
    });
  }

  async reopenConversation(conversationId: string) {
    return this.request<{ success: boolean }>(`/conversations/${conversationId}/reopen`, {
      method: 'POST',
    });
  }

  async addReaction(messageId: string, emoji: string) {
    return this.request<{ success: boolean }>(`/conversations/messages/${messageId}/reaction`, {
      method: 'PUT',
      body: JSON.stringify({ emoji }),
    });
  }

  async markConversationRead(conversationId: string) {
    return this.request<{ success: boolean }>(`/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  // Stories
  async getStoriesFeed() {
    return this.request<{ feeds: any[] }>('/stories/feed');
  }

  async createStory(data: {
    type?: string;
    text?: string;
    mediaUrl?: string;
    background?: string;
    audience?: string;
    data?: any;
  }) {
    return this.request<{ story: Story }>('/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async viewStory(storyId: string) {
    return this.request<{ success: boolean }>(`/stories/${storyId}/view`, {
      method: 'POST',
    });
  }

  async votePoll(storyId: string, optionIndex: number) {
    return this.request<{ poll: any }>(`/stories/${storyId}/poll-vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIndex }),
    });
  }

  async answerQA(storyId: string, text: string) {
    return this.request<{ qa: any }>(`/stories/${storyId}/qa-answer`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getStoryInsights(storyId: string) {
    return this.request<{ viewsCount: number; viewers: any[]; data: any }>(`/stories/${storyId}/insights`);
  }

  // Games
  async getGames() {
    return this.request<{ games: any[] }>('/games');
  }

  async createGameSession(gameKey: string, conversationId?: string, opponentId?: string) {
    return this.request<{ session: GameSession }>('/games/sessions', {
      method: 'POST',
      body: JSON.stringify({ gameKey, conversationId, opponentId }),
    });
  }

  async getGameSession(sessionId: string) {
    return this.request<{ session: GameSession }>(`/games/sessions/${sessionId}`);
  }

  async makeGameMove(sessionId: string, move: any) {
    return this.request<{ session: GameSession }>(`/games/sessions/${sessionId}/move`, {
      method: 'POST',
      body: JSON.stringify({ move }),
    });
  }
}

export const api = new ApiClient();
