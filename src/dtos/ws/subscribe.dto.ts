import { z } from 'zod';

export const subscribeSchema = z
  .object({
    type: z.literal('subscribe'),
    taskId: z
      .string({ message: 'task id must be a string' })
      .uuid({ message: 'task id must be a valid uuid' }),
  })
  .strict();

export type SubscribeDto = z.output<typeof subscribeSchema>;
