import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import { RedisService } from "../../redis/redis.service";

/**
 * Redis-backed fixed-window rate limit for itinerary generation:
 * max 10 requests per hour per client IP.
 */
@Injectable()
export class GenerateRateLimitGuard implements CanActivate {
  private static readonly LIMIT = 10;
  private static readonly WINDOW_SECONDS = 60 * 60;

  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const forwarded = request.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim()) ||
      request.ip ||
      "unknown";

    const allowed = await this.redis.checkRateLimit(
      `rate:generate:${ip}`,
      GenerateRateLimitGuard.LIMIT,
      GenerateRateLimitGuard.WINDOW_SECONDS
    );
    if (!allowed) {
      throw new HttpException(
        "Too many itinerary generations — try again in an hour",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }
}
