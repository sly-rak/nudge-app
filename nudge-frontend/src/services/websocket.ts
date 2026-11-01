import { RealtimeServerEvent, RealtimeClientEvent } from '@nudge/shared';

type EventListener = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;
  private currentToken: string | null = null;

  public connect(token: string) {
    this.currentToken = token;
    this.isExplicitlyClosed = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/v1/ws?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to Nudge Realtime');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimeServerEvent;
          this.dispatch(payload.t, payload.d);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        if (!this.isExplicitlyClosed && this.currentToken) {
          this.reconnectTimer = setTimeout(() => {
            console.log('[WebSocket] Attempting to reconnect...');
            this.connect(this.currentToken!);
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[WebSocket] Socket error:', err);
      };
    } catch (err) {
      console.error('[WebSocket] Connection initialization error:', err);
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(event: RealtimeClientEvent) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('[WebSocket] Cannot send, socket is not open');
    }
  }

  public on(eventType: string, listener: EventListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(listener);
      }
    };
  }

  private dispatch(eventType: string, data: any) {
    const set = this.listeners.get(eventType);
    if (set) {
      for (const listener of set) {
        try {
          listener(data);
        } catch (err) {
          console.error(`[WebSocket] Listener error for ${eventType}:`, err);
        }
      }
    }
  }
}

export const wsClient = new WebSocketClient();
