let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
const listeners: Map<string, Set<(data: any) => void>> = new Map();

export function connectWebSocket(): void {
  if (ws?.readyState === WebSocket.OPEN || isConnecting) {
    return;
  }

  isConnecting = true;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      isConnecting = false;
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);

        const typeListeners = listeners.get(message.type);
        if (typeListeners) {
          typeListeners.forEach(callback => callback(message.data));
        }

        const allListeners = listeners.get('*');
        if (allListeners) {
          allListeners.forEach(callback => callback(message));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnecting = false;
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      ws = null;
      isConnecting = false;

      reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket();
      }, 3000);
    };
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    isConnecting = false;
  }
}

export function disconnectWebSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }
}

export function subscribeToWebSocket(
  eventType: string,
  callback: (data: any) => void
): () => void {
  if (!listeners.has(eventType)) {
    listeners.set(eventType, new Set());
  }

  const typeListeners = listeners.get(eventType)!;
  typeListeners.add(callback);

  return () => {
    typeListeners.delete(callback);
    if (typeListeners.size === 0) {
      listeners.delete(eventType);
    }
  };
}

export function sendWebSocketMessage(message: any): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket is not connected');
  }
}

export function getWebSocketState(): number {
  return ws?.readyState ?? WebSocket.CLOSED;
}
