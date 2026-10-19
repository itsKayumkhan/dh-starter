import { MESSAGES } from "@/lib/constants/messages";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class UnauthorizedError extends AppError {
  constructor() {
    super("UNAUTHORIZED", MESSAGES.unauthorized);
  }
}
export class ForbiddenError extends AppError {
  constructor() {
    super("FORBIDDEN", MESSAGES.forbidden);
  }
}
export class NotFoundError extends AppError {
  constructor() {
    super("NOT_FOUND", MESSAGES.notFound);
  }
}
export class ValidationError extends AppError {
  constructor() {
    super("VALIDATION", MESSAGES.validation);
  }
}
export class RateLimitError extends AppError {
  constructor() {
    super("RATE_LIMIT", MESSAGES.rateLimited);
  }
}
export class ConflictError extends AppError {
  constructor() {
    super("CONFLICT", MESSAGES.conflict);
  }
}
