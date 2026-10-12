import { Server } from 'node:http';
import { WebSocketServer } from 'ws';
import { handleWS } from '../websocket/ws.handler';
import { unsubscribe } from '../websocket/subscriptions';

export const initWebSocket = (server: Server) => {
  const socket = new WebSocketServer({ server, path: '/ws' });
  socket.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (data) => handleWS(ws, data).catch(console.error));
    ws.on('close', () => unsubscribe(ws));
  });
};
