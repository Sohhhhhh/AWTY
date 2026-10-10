import { CreateTaskDto } from '../dtos/tasks/create-task.dto';
import { Task } from '../types/app.types';

export interface ITasksRepository {
  create(dto: CreateTaskDto): Promise<Task>;
  findOne(id: string): Promise<Task | undefined>;
}
