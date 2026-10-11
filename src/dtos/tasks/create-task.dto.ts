import z from 'zod';
import { MAX_TASK_DURATION } from '../../queue/queues';

export const createTaskSchema = z
  .object({
    duration: z.int().min(1).max(MAX_TASK_DURATION),
  })
  .strict();

export type CreateTaskDto = z.output<typeof createTaskSchema>;
