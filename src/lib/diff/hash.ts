import { createHash } from "crypto";
import type { DiffFile } from "@/lib/diff/filter";

/**
 * Stable content hash of the filtered diff used for Redis deduplication.
 * Same relevant content → same hash → skip re-analysis / re-comment.
 */
export function hashFilteredDiff(files: DiffFile[]): string {
  const canonical = files
    .map((f) => `${f.filename}\0${f.status}\0${f.patch ?? ""}`)
    .sort()
    .join("\n");

  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function dedupKey(owner: string, repo: string, prNumber: number): string {
  return `pr-assistant:diff:${owner}/${repo}:${prNumber}`;
}
