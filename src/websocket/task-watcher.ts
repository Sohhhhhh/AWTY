import { Client } from 'pg';
import envConfig from '../config/env';
import { tasksRepository } from '../containers/repositories.container';
import { broadcast } from './subscriptions';

export const watch = async () => {
  const client = new Client({ connectionString: envConfig.DATABASE_URL });
  await client.connect();
  await client.query('LISTEN task_updates');

  client.on('notification', async (msg) => {
    try {
      const taskId = msg.payload;
      if (!taskId) return;
      const task = await tasksRepository.findOne(taskId);
      if (!task) return;
      broadcast(taskId, JSON.stringify(task));
    } catch (err) {
      console.error(err);
    }
  });

  client.on('error', console.error);
};
