import { boss } from '../config/boss';
import { tasksProcessor } from '../containers/worker.container';
import { TASK_DLQ, TASK_QUEUE } from '../queue/queues';

export async function qHandler() {
  await boss.work<{ taskId: string }>(
    TASK_QUEUE,
    { localConcurrency: 5 },
    async (jobs) => {
      await Promise.all(
        jobs.map((job) => tasksProcessor.work(job.data.taskId)),
      );
    },
  );
}

export async function dlqHandler() {
  await boss.work<{ taskId: string }>(TASK_DLQ, async (jobs) => {
    await Promise.all(jobs.map((job) => tasksProcessor.fail(job.data.taskId)));
  });
}
