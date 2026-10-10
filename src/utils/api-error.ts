export default class extends Error {
  isOperational: boolean;
  statusCode: number;
  issues?: unknown[];

  constructor(message: string, statusCode: number, issues?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.issues = issues;
    Error.captureStackTrace(this, this.constructor);
  }
}
