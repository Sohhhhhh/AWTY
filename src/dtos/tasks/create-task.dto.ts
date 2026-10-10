import z from 'zod';

export const createTaskSchema = z
  .object({
    duration: z.int(),
  })
  .strict();

export type CreateTaskDto = z.output<typeof createTaskSchema>;
