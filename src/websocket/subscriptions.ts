import { WebSocket } from 'ws';

const subscribers = new Map<string, Set<WebSocket>>();

export const subscribe = (ws: WebSocket, taskId: string) => {
  if (!subscribers.has(taskId)) {
    subscribers.set(taskId, new Set());
  }
  subscribers.get(taskId)?.add(ws);
};

export const unsubscribe = (ws: WebSocket) => {
  for (const [id, valueSet] of subscribers.entries()) {
    if (valueSet.has(ws)) {
      valueSet.delete(ws);

      if (valueSet.size === 0) {
        subscribers.delete(id);
      }
    }
  }
};

export const broadcast = (taskId: string, message: string) => {
  const websockets = subscribers.get(taskId);

  websockets?.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(message);
  });
};
