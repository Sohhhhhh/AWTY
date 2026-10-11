import { boss } from '../config/boss';

export const MAX_TASK_DURATION = 600;

export const TASK_QUEUE = 'task-add';
export const TASK_DLQ = 'task-dead-letter';

export const TASK_OPTIONS = {
  name: TASK_QUEUE,
  retryLimit: 5,
  retryDelay: 2,
  expireInSeconds: MAX_TASK_DURATION + 300,
  deadLetter: TASK_DLQ,
  heartbeatSeconds: 15,
};

export async function setup() {
  await boss.start();
  await boss.createQueue(TASK_DLQ);

  await boss.createQueue(TASK_QUEUE, TASK_OPTIONS);
}

export async function enqueueJob(job: any) {
  const jobId = await boss.send(TASK_QUEUE, job);
  console.log(`queued job ${jobId}`);
}
