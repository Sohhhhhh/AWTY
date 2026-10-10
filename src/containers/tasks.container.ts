import { tasksRepository } from './repositories.container';
import { TasksService } from '../services/tasks.service';
import { TasksController } from '../controllers/tasks.controller';

// ----- Services -----

export const tasksService = new TasksService(tasksRepository);

// ----- Controllers -----

export const tasksController = new TasksController(tasksService);
