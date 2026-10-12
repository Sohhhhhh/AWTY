import { db } from '../config/drizzle';
import { and, eq, ne, or, sql } from 'drizzle-orm';

import { tasks } from '../drizzle/schema/schema';
import { CreateTaskDto } from '../dtos/tasks/create-task.dto';
import { ITasksRepository } from '../interfaces/repositories.interface';

export class TasksRepository implements ITasksRepository {
  async create(dto: CreateTaskDto) {
    const [task] = await db
      .insert(tasks)
      .values({ ...dto })
      .returning();

    return task;
  }

  async findOne(id: string) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));

    return task;
  }

  async claim(id: string) {
    const [task] = await db
      .update(tasks)
      .set({ status: 'processing' })
      .where(
        and(
          eq(tasks.id, id),
          or(eq(tasks.status, 'processing'), eq(tasks.status, 'pending')),
        ),
      )
      .returning();

    return task;
  }

  async updateProgress(id: string, progress: number) {
    const task = await db.transaction(async (tx) => {
      const [updatedTask] = await tx
        .update(tasks)
        .set({ progress })
        .where(and(eq(tasks.id, id), eq(tasks.status, 'processing')))
        .returning();

      if (!updatedTask) return undefined;

      await tx.execute(
        sql`select pg_notify('task_updates', ${updatedTask.id})`,
      );
      return updatedTask;
    });

    return task;
  }

  async complete(id: string) {
    const task = await db.transaction(async (tx) => {
      const [completedTask] = await tx
        .update(tasks)
        .set({ status: 'completed', progress: 100 })
        .where(and(eq(tasks.id, id), eq(tasks.status, 'processing')))
        .returning();
      if (!completedTask) return undefined;

      await tx.execute(
        sql`select pg_notify('task_updates', ${completedTask.id})`,
      );
      return completedTask;
    });

    return task;
  }

  async fail(id: string) {
    const task = await db.transaction(async (tx) => {
      const [failedTask] = await tx
        .update(tasks)
        .set({ status: 'failed' })
        .where(and(eq(tasks.id, id), ne(tasks.status, 'completed')))
        .returning();
      if (!failedTask) return undefined;

      await tx.execute(sql`select pg_notify('task_updates', ${failedTask.id})`);
      return failedTask;
    });
    return task;
  }
}
