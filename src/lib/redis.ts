import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;

  const env = getEnv();
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redis;
}

/** Test helper */
export function resetRedisClient(): void {
  redis = null;
}
