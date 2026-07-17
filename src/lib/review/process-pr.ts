import { getEnv } from "@/lib/env";
import { DEFAULT_IGNORE_PATTERNS } from "@/config/ignore";
import {
  buildDiffText,
  filterDiffFiles,
  type DiffFile,
} from "@/lib/diff/filter";
import { hashFilteredDiff } from "@/lib/diff/hash";
import {
  analyzePullRequestDiff,
  mockAnalyzePullRequestDiff,
} from "@/lib/ai/analyze";
import { formatReviewComment } from "@/lib/review/format-comment";
import { getLastAnalyzedHash, saveAnalyzedHash } from "@/lib/review/dedup";
import { SAMPLE_DIFF_FILES } from "@/lib/review/sample-diff";
import { checkRateLimit } from "@/lib/rate-limit";
import { createInstallationOctokit } from "@/lib/github/auth";
import {
  fetchPullRequestFiles,
  postPullRequestComment,
} from "@/lib/github/api";
import type { PullRequestWebhook } from "@/lib/github/events";

export type ProcessResult =
  | { status: "skipped"; reason: string }
  | {
      status: "reviewed";
      dryRun: boolean;
      commentBody: string;
      commentUrl?: string;
      diffHash: string;
      filesAnalyzed: number;
      filesIgnored: number;
      truncated: boolean;
    };

function resolveIgnorePatterns(): string[] {
  const env = getEnv();
  if (!env.DIFF_IGNORE_PATTERNS) {
    return DEFAULT_IGNORE_PATTERNS;
  }

  const extra = env.DIFF_IGNORE_PATTERNS.split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  return [...DEFAULT_IGNORE_PATTERNS, ...extra];
}

export async function processPullRequest(
  payload: PullRequestWebhook,
): Promise<ProcessResult> {
  const env = getEnv();
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const installationId = payload.installation?.id;

  if (!installationId && !env.PR_ASSISTANT_DRY_RUN) {
    return {
      status: "skipped",
      reason: "Missing installation id on webhook payload",
    };
  }

  // Rate limit (skipped in dry-run so local fixture tests stay simple)
  if (!env.PR_ASSISTANT_DRY_RUN && installationId) {
    const rl = await checkRateLimit(installationId, owner, repo);
    if (!rl.success) {
      return {
        status: "skipped",
        reason: "Rate limit exceeded for this installation/repository",
      };
    }
  }

  let rawFiles: DiffFile[];

  if (env.PR_ASSISTANT_DRY_RUN) {
    rawFiles = SAMPLE_DIFF_FILES;
  } else {
    const octokit = createInstallationOctokit(installationId!);
    rawFiles = await fetchPullRequestFiles(octokit, owner, repo, prNumber);
  }

  const filtered = filterDiffFiles(rawFiles, {
    ignorePatterns: resolveIgnorePatterns(),
  });

  if (filtered.files.length === 0) {
    return {
      status: "skipped",
      reason: "No reviewable files after ignore filters",
    };
  }

  const diffHash = hashFilteredDiff(filtered.files);

  if (!env.PR_ASSISTANT_DRY_RUN) {
    const previous = await getLastAnalyzedHash(owner, repo, prNumber);
    if (previous === diffHash) {
      return {
        status: "skipped",
        reason: "Diff hash unchanged — skipping duplicate analysis",
      };
    }
  }

  const diffText = buildDiffText(filtered.files);

  // Never log full diffs — only metadata
  console.info(
    JSON.stringify({
      msg: "pr_assistant.analyze_start",
      owner,
      repo,
      prNumber,
      filesAnalyzed: filtered.files.length,
      filesIgnored: filtered.ignoredFiles.length,
      totalChars: filtered.totalChars,
      truncated: filtered.truncated,
      dryRun: env.PR_ASSISTANT_DRY_RUN,
    }),
  );

  const analysis = env.PR_ASSISTANT_DRY_RUN
    ? mockAnalyzePullRequestDiff({
        owner,
        repo,
        prNumber,
        title: payload.pull_request.title,
        author: payload.pull_request.user?.login,
        diffText,
        truncated: filtered.truncated,
        truncationReason: filtered.truncationReason,
        ignoredCount: filtered.ignoredFiles.length,
      })
    : await analyzePullRequestDiff({
        owner,
        repo,
        prNumber,
        title: payload.pull_request.title,
        author: payload.pull_request.user?.login,
        diffText,
        truncated: filtered.truncated,
        truncationReason: filtered.truncationReason,
        ignoredCount: filtered.ignoredFiles.length,
      });

  const commentBody = formatReviewComment(analysis, {
    truncated: filtered.truncated,
    truncationReason: filtered.truncationReason,
    dryRun: env.PR_ASSISTANT_DRY_RUN,
    modelLabel: env.PR_ASSISTANT_DRY_RUN ? "dry-run-mock" : env.ANTHROPIC_MODEL,
  });

  if (env.PR_ASSISTANT_DRY_RUN) {
    return {
      status: "reviewed",
      dryRun: true,
      commentBody,
      diffHash,
      filesAnalyzed: filtered.files.length,
      filesIgnored: filtered.ignoredFiles.length,
      truncated: filtered.truncated,
    };
  }

  const octokit = createInstallationOctokit(installationId!);
  const comment = await postPullRequestComment(
    octokit,
    owner,
    repo,
    prNumber,
    commentBody,
  );

  await saveAnalyzedHash(owner, repo, prNumber, diffHash);

  console.info(
    JSON.stringify({
      msg: "pr_assistant.comment_posted",
      owner,
      repo,
      prNumber,
      commentId: comment.id,
      // intentionally omit comment body / diff
    }),
  );

  return {
    status: "reviewed",
    dryRun: false,
    commentBody,
    commentUrl: comment.html_url,
    diffHash,
    filesAnalyzed: filtered.files.length,
    filesIgnored: filtered.ignoredFiles.length,
    truncated: filtered.truncated,
  };
}
