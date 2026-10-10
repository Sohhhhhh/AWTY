import { Router } from 'express';

import { validateId } from '../validators/common.validator';
import { tasksController } from '../containers/tasks.container';
import { validateCreateTask } from '../validators/tasks.validator';

const router = Router();

router
  .post('/', validateCreateTask, tasksController.create)
  .get('/:id', validateId, tasksController.findOne);

export const tasksRoutes = router;
