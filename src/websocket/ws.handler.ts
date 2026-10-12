import { RawData, WebSocket } from 'ws';
import { subscribeSchema } from '../dtos/ws/subscribe.dto';
import { tasksRepository } from '../containers/repositories.container';
import { subscribe } from './subscriptions';

export const handleWS = async (ws: WebSocket, data: RawData) => {
  let message: unknown;

  try {
    message = JSON.parse(data.toString());
  } catch {
    ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const result = subscribeSchema.safeParse(message);

  if (!result.success) {
    ws.send(
      JSON.stringify({
        error: 'Invalid message',
        details: result.error.issues,
      }),
    );
    return;
  }

  const { taskId } = result.data;
  const task = await tasksRepository.findOne(taskId);

  if (!task) {
    ws.send(
      JSON.stringify({
        error: 'No task found with this id',
      }),
    );
    return;
  }

  subscribe(ws, task.id);
  ws.send(JSON.stringify(task));
};
