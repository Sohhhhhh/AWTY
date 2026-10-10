import { ITasksService } from '../interfaces/services.interface';
import { APIResponse } from '../types/api.types';
import { sendResponse } from '../utils/send-response';
import { idValidatedCtrlr } from '../validators/common.validator';
import { createTaskValidatedCtrlr } from '../validators/tasks.validator';

export class TasksController {
  constructor(private readonly tasksService: ITasksService) {}

  create: createTaskValidatedCtrlr = async (req, res) => {
    const result: APIResponse = await this.tasksService.create(req.body);
    sendResponse(res, result);
  };

  findOne: idValidatedCtrlr = async (req, res) => {
    const { id } = req.params;
    const result: APIResponse = await this.tasksService.findOne(id);
    sendResponse(res, result);
  };
}
