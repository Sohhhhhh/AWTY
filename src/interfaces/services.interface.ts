import { APIResponse } from '../types/api.types';
import { CreateTaskDto } from '../dtos/tasks/create-task.dto';

export interface ITasksService {
  create(dto: CreateTaskDto): Promise<APIResponse>;
  findOne(id: string): Promise<APIResponse>;
}
