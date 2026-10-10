import { TypedRequestHandler, validate } from 'zod-express-validator';

import { createTaskSchema } from '../dtos/tasks/create-task.dto';

export const validateCreateTask = validate({
  body: createTaskSchema,
});
export type createTaskValidatedCtrlr = TypedRequestHandler<
  typeof validateCreateTask
>;
