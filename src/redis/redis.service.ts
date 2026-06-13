import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

/** Cache TTLs (seconds) mandated by the integration spec. */
export const GOOGLE_PLACES_CACHE_TTL = 24 * 60 * 60; // 24h
export const GOOGLE_ROUTES_CACHE_TTL = 60 * 60; // 1h

/**
 * Thin wrapper around a single ioredis connection (Upstash-compatible).
 * Used for rate limiting and Google API response caching. BullMQ holds its
 * own connections via @nestjs/bullmq.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.get<string>("REDIS_URL") ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      // Don't crash the app when Redis is unreachable in local dev
      retryStrategy: (times) => Math.min(times * 500, 5000),
    });
    this.client.on("error", () => {
      /* logged by callers on demand; avoid unhandled error event */
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }

  /** Get a cached JSON value, or null on miss / Redis failure. */
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /** Cache a JSON value with a TTL. Failures are swallowed (cache is best-effort). */
  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      /* best-effort cache */
    }
  }

  /**
   * Fixed-window rate limiter: INCR + EXPIRE on first hit.
   * Returns true when the caller is within the limit.
   * Fails open if Redis is unavailable.
   */
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, windowSeconds);
      }
      return count <= limit;
    } catch {
      return true;
    }
  }
}
