import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface EmergencyMessage {
  type: 'emergency_created' | 'emergency_updated' | 'emergency_status_changed';
  data: any;
}

let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();

export function setupWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket client connected');
    clients.add(ws);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Echo back for confirmation
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ack', data }));
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send initial connection confirmation
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'WebSocket connection established' 
      }));
    }
  });

  console.log('WebSocket server initialized on /ws');
}

export function broadcastEmergency(type: EmergencyMessage['type'], data: any): void {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  
  let sent = 0;
  let failed = 0;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        sent++;
      } catch (error) {
        console.error('Failed to send to client:', error);
        failed++;
      }
    } else {
      failed++;
    }
  });

  console.log(`Broadcast ${type}: sent to ${sent} clients, ${failed} failed`);
}

export function getConnectedClientsCount(): number {
  return Array.from(clients).filter(c => c.readyState === WebSocket.OPEN).length;
}
