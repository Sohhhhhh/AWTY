import { TasksProcessor } from '../workers/task.processor';
import { tasksRepository } from './repositories.container';

export const tasksProcessor = new TasksProcessor(tasksRepository);
