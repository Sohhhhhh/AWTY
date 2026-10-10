import { z } from 'zod';

export const idSchema = z
  .object({
    id: z
      .string({ message: 'id must be a string' })
      .uuid({ message: 'id must be a valid uuid' }),
  })
  .strict();

export type IdDto = z.output<typeof idSchema>;
