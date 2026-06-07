export type WSMessageType =
  | 'player:state'
  | 'player:progress'
  | 'player:track-change'
  | 'player:play'
  | 'player:pause'
  | 'player:stop'
  | 'queue:update'
  | 'download:progress'
  | 'download:completed'
  | 'download:failed'
  | 'search:results'
  | 'visualizer:data';

export interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
}

export type MessageHandler = (message: WSMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<WSMessageType, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string = '';
  private isConnected = false;

  connect(url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`): void {
    this.url = url;
    this.connectWs();
  }

  private connectWs(): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnected = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        const typeHandlers = this.handlers.get(message.type);
        if (typeHandlers) {
          typeHandlers.forEach((handler) => handler(message));
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.reconnectTimer = setTimeout(() => this.connectWs(), 3000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  on(type: WSMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  send(type: string, payload: Record<string, unknown> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const wsService = new WebSocketService();
