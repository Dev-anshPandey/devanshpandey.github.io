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
export async function rateLimit(request: Request) {
  const production = process.env.NODE_ENV === "production";
  const salt = process.env.RATE_LIMIT_SALT;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (production && (!url || !token || !salt || salt.length < 32))
    throw new Error("Rate limit not configured");
  // Vercel overwrites this header. Do not trust arbitrary forwarded headers on other hosts.
  // Non-Vercel hosts share one bucket unless an explicitly trusted proxy adapter is added.
  const address = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    : "local";
  const key = createHash("sha256")
    .update(`${salt || "development"}:${address}`)
    .digest("hex");
  if (url && token) {
    shared ??= new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(6, "1 m"),
      prefix: "portfolio:chat",
      analytics: false,
      timeout: 1000,
    });
    const result = await shared.limit(key);
    if (result.reason === "timeout") throw new Error("Rate limit unavailable");
    return result;
  }
  return local.check(key);
}
