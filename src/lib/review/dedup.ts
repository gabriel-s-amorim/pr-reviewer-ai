import { getRedis } from "@/lib/redis";
import { dedupKey } from "@/lib/diff/hash";

const DEDUP_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function getLastAnalyzedHash(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<string | null> {
  const redis = getRedis();
  const value = await redis.get<string>(dedupKey(owner, repo, prNumber));
  return value ?? null;
}

export async function saveAnalyzedHash(
  owner: string,
  repo: string,
  prNumber: number,
  hash: string,
): Promise<void> {
  const redis = getRedis();
  await redis.set(dedupKey(owner, repo, prNumber), hash, {
    ex: DEDUP_TTL_SECONDS,
  });
}
