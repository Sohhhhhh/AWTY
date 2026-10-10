import type { NextFunction, Request, Response } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Couldn't find ${req.originalUrl} on the server`,
  });
};
