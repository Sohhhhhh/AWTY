import { setup } from './queue/queues';
import { dlqHandler, qHandler } from './workers/task.handler';

async function main() {
  await setup();
  await qHandler();
  await dlqHandler();
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
