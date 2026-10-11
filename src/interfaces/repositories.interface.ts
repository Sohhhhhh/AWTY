import { Task } from '../types/app.types';
import { CreateTaskDto } from '../dtos/tasks/create-task.dto';

export interface ITasksRepository {
  create(dto: CreateTaskDto): Promise<Task>;
  findOne(id: string): Promise<Task | undefined>;
  claim(id: string): Promise<Task | undefined>;
  updateProgress(id: string, progress: number): Promise<Task | undefined>;
  complete(id: string): Promise<Task | undefined>;
  fail(id: string): Promise<Task | undefined>;
}
