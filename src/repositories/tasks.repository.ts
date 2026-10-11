import { db } from '../config/drizzle';
import { and, eq, ne, or } from 'drizzle-orm';
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
    const [task] = await db
      .update(tasks)
      .set({ progress: progress })
      .where(and(eq(tasks.id, id), eq(tasks.status, 'processing')))
      .returning();

    return task;
  }

  async complete(id: string) {
    const [task] = await db
      .update(tasks)
      .set({ status: 'completed', progress: 100 })
      .where(and(eq(tasks.id, id), eq(tasks.status, 'processing')))
      .returning();

    return task;
  }

  async fail(id: string) {
    const [task] = await db
      .update(tasks)
      .set({ status: 'failed' })
      .where(and(eq(tasks.id, id), ne(tasks.status, 'completed')))
      .returning();

    return task;
  }
}
