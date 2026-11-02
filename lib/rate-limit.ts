import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export class MemoryLimiter {
  private buckets = new Map<string, { count: number; reset: number }>();
  constructor(
    private limit = 6,
    private windowMs = 60000,
  ) {}
  check(key: string, now = Date.now()) {
    for (const [id, item] of this.buckets)
      if (item.reset <= now) this.buckets.delete(id);
    let item = this.buckets.get(key);
    if (!item) {
      item = { count: 0, reset: now + this.windowMs };
      this.buckets.set(key, item);
    }
    item.count++;
    return { success: item.count <= this.limit, reset: item.reset };
  }
}

const local = new MemoryLimiter();
let shared: Ratelimit | undefined;
let warnedAboutLocalFallback = false;

export async function rateLimit(request: Request) {
  const salt = process.env.RATE_LIMIT_SALT;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Vercel overwrites this header. Do not trust arbitrary forwarded headers on other hosts.
  // Non-Vercel hosts share one bucket unless an explicitly trusted proxy adapter is added.
  const address = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    : "local";
  const key = createHash("sha256")
    .update(`${salt || "development"}:${address}`)
    .digest("hex");

  const sharedLimiterConfigured =
    Boolean(url) && Boolean(token) && Boolean(salt) && salt!.length >= 32;

  if (sharedLimiterConfigured) {
    try {
      shared ??= new Ratelimit({
        redis: new Redis({ url: url!, token: token! }),
        limiter: Ratelimit.slidingWindow(6, "1 m"),
        prefix: "portfolio:chat",
        analytics: false,
        timeout: 1000,
      });
      const result = await shared.limit(key);
      if (result.reason !== "timeout") return result;
      console.warn(
        "[portfolio] Shared rate limiter timed out; using in-memory limiter.",
      );
    } catch (error) {
      console.warn(
        "[portfolio] Shared rate limiter unavailable; using in-memory limiter.",
        error,
      );
    }
  } else if (!warnedAboutLocalFallback) {
    warnedAboutLocalFallback = true;
    console.warn(
      "[portfolio] Upstash rate limiting is not fully configured; using in-memory limiter. Groq remains enabled.",
    );
  }

  return local.check(key);
}
