import app from './app';
import env from './config/env';
import { initWebSocket } from './config/ws';
import { setup } from './queue/queues';
import { watch } from './websocket/task-watcher';

process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION. Shutting down...', err);

  process.exit(1);
});

setup();

export const server = app.listen(env.PORT, () => {
  console.info(`Server is running on port: ${env.PORT}`);
});

initWebSocket(server);
watch().catch(console.error);

process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION. Shutting down...', err);

  server.close(() => {
    process.exit(1);
  });
});
