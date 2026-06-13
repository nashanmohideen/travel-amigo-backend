import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import type { ApiError } from "../types/domain";

/**
 * Maps all exceptions to the ApiError shape the frontend already consumes:
 *   { message: string; code: string; details?: unknown }
 * Never exposes stack traces or raw error messages for unexpected errors.
 */
@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const apiError: ApiError = { message: exception.message, code: codeForStatus(status) };

      // class-validator errors arrive as { message: string[] }
      if (typeof body === "object" && body !== null) {
        const obj = body as Record<string, unknown>;
        if (Array.isArray(obj.message)) {
          apiError.message = "Validation failed";
          apiError.code = "VALIDATION_ERROR";
          apiError.details = obj.message;
        } else if (typeof obj.message === "string") {
          apiError.message = obj.message;
        }
        if (typeof obj.code === "string") {
          apiError.code = obj.code;
        }
      }
      res.status(status).json(apiError);
      return;
    }

    console.error("Unhandled exception:", exception);
    const apiError: ApiError = {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    };
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(apiError);
  }
}

function codeForStatus(status: number): string {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    default:
      return "INTERNAL_ERROR";
  }
}
