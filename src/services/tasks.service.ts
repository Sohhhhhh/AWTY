import APIError from '../utils/api-error';
import { enqueueJob } from '../queue/queues';
import { STATUS_CODES } from '../utils/status-codes';
import { CreateTaskDto } from '../dtos/tasks/create-task.dto';
import { ITasksService } from '../interfaces/services.interface';
import { ITasksRepository } from '../interfaces/repositories.interface';

export class TasksService implements ITasksService {
  constructor(private readonly tasksRepo: ITasksRepository) {}

  async create(dto: CreateTaskDto) {
    const task = await this.tasksRepo.create(dto);
    await enqueueJob({ taskId: task.id });

    return {
      statusCode: STATUS_CODES.Created,
      data: task,
    };
  }

  async findOne(id: string) {
    const task = await this.tasksRepo.findOne(id);
    if (!task)
      throw new APIError('No task found with this id', STATUS_CODES.NotFound);

    return {
      statusCode: STATUS_CODES.OK,
      data: task,
    };
  }
}
