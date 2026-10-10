import { NextFunction, Request, Response } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  const result = {
    status: 'OK',
    statusCode: 200,
    message: `API is healthy :D`,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(result);
};
