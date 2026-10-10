import { Response } from 'express';
import { APIResponse } from '../types/api.types';

export const sendResponse = (res: Response, result: APIResponse) => {
  res.status(result.statusCode).json({
    data: result.data,
    message: result.message,
  });
};
