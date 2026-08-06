export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(statusCode: number, message: string, code = 'INTERNAL') {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message, 'CONFLICT')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'UNAUTHENTICATED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message, 'FORBIDDEN')
  }
}

export class UnprocessableError extends AppError {
  constructor(message = 'Request is valid but cannot be processed in the current state') {
    super(422, message, 'UNPROCESSABLE')
  }
}
