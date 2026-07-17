import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";

let limiter: Ratelimit | null = null;

/**
 * Soft cost control: max reviews per installation+repo window.
 * Prevents webhook loops or noisy synchronize storms from burning AI credits.
 */
function getLimiter(): Ratelimit {
  if (limiter) return limiter;

  limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(8, "1 h"),
    prefix: "pr-assistant:rl",
    analytics: true,
  });

  return limiter;
}

export async function checkRateLimit(
  installationId: number,
  owner: string,
  repo: string,
): Promise<{ success: boolean; remaining: number }> {
  const key = `${installationId}:${owner}/${repo}`;
  const result = await getLimiter().limit(key);

  return {
    success: result.success,
    remaining: result.remaining,
  };
}
