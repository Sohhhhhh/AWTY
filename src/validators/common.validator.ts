import { TypedRequestHandler, validate } from 'zod-express-validator';

import { idSchema } from '../dtos/common/id.dto';

export const validateId = validate({
  params: idSchema,
});
export type idValidatedCtrlr = TypedRequestHandler<typeof validateId>;
