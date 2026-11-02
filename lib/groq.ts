import { createGroq } from "@ai-sdk/groq";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
export const MAX_OUTPUT_TOKENS = 600;
export const GENERATION_TIMEOUT_MS = 18000;
export type ProviderFailure =
  | "rate_limit"
  | "quota"
  | "timeout"
  | "auth"
  | "permission"
  | "unavailable"
  | "network"
  | "invalid_response"
  | "unknown";
let cooldownUntil = 0;
export function retryAfterMs(value: string | null, now = Date.now()) {
  if (!value) return 0;
  const seconds = Number(value);
  return Number.isFinite(seconds)
    ? Math.max(0, seconds * 1000)
    : Math.max(0, Date.parse(value) - now) || 0;
}
export function providerReady() {
  return Date.now() >= cooldownUntil;
}
export function resetProviderCooldown() {
  cooldownUntil = 0;
}
export function createPortfolioModel(
  fetcher: typeof fetch = fetch,
  apiKey = process.env.GROQ_API_KEY,
) {
  return createGroq({
    apiKey,
    fetch: async (input, init) => {
      const response = await fetcher(input, init);
      // These headers are observed only on the server; never forwarded to visitors.
      if (response.status === 429) {
        const retry = retryAfterMs(response.headers.get("retry-after"));
        cooldownUntil = Math.max(
          cooldownUntil,
          Date.now() + Math.min(retry, 86400000),
        );
        console.info("[portfolio] Groq rate limited; using fallback", {
          retryAfterSeconds: Math.ceil(retry / 1000),
          remainingRequests: response.headers
            .get("x-ratelimit-remaining-requests")
            ?.slice(0, 20),
          remainingTokens: response.headers
            .get("x-ratelimit-remaining-tokens")
            ?.slice(0, 20),
        });
      }
      return response;
    },
  })(process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL);
}
export function classifyProviderFailure(error: unknown): ProviderFailure {
  const e = error as { statusCode?: number; name?: string; cause?: unknown };
  if (e?.statusCode === 429) return "rate_limit";
  if (e?.statusCode === 401) return "auth";
  if (e?.statusCode === 403) return "permission";
  if (e?.statusCode === 404 || Number(e?.statusCode) >= 500)
    return "unavailable";
  if (/Timeout|Abort/.test(e?.name || "")) return "timeout";
  if (
    /JSON|NoObject|NoOutput|TypeValidation|InvalidResponse/.test(e?.name || "")
  )
    return "invalid_response";
  if (e?.name === "TypeError" || e?.cause) return "network";
  return "unknown";
}
