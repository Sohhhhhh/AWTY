import { eq } from 'drizzle-orm';
import { db } from '../config/drizzle';
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
}
