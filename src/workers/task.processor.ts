import { ITasksRepository } from '../interfaces/repositories.interface';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class TasksProcessor {
  constructor(private readonly tasksRepo: ITasksRepository) {}

  async work(id: string) {
    const task = await this.tasksRepo.claim(id);
    if (!task) return;

    const start = task.progress;
    const numUpdates = Math.max(
      1,
      Math.ceil((task.duration * (100 - start)) / 100),
    );
    let curProgress = start;

    for (let i = 1; i < numUpdates; i++) {
      await sleep(1000);

      const progress = Math.min(
        99,
        Math.round(start + ((100 - start) * i) / numUpdates),
      );

      if (progress === curProgress) continue;

      const curTask = await this.tasksRepo.updateProgress(id, progress);
      if (!curTask) return;
      curProgress = progress;
    }

    await sleep(1000);
    await this.tasksRepo.complete(id);
  }

  async fail(id: string) {
    await this.tasksRepo.fail(id);
  }
}
