import {
  DEFAULT_IGNORE_PATTERNS,
  MAX_DIFF_CHARS,
  MAX_FILE_DIFF_CHARS,
  MAX_FILES_TO_ANALYZE,
} from "@/config/ignore";

export type DiffFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

export type FilteredDiff = {
  files: DiffFile[];
  totalChars: number;
  ignoredFiles: string[];
  truncated: boolean;
  truncationReason?: string;
};

function matchGlob(filename: string, pattern: string): boolean {
  const normalized = filename.replace(/\\/g, "/");
  const pat = pattern.replace(/\\/g, "/");

  if (pat.endsWith("/")) {
    return normalized.includes(`/${pat}`) || normalized.startsWith(pat);
  }

  if (pat.startsWith("*.")) {
    return normalized.toLowerCase().endsWith(pat.slice(1).toLowerCase());
  }

  if (pat.includes("*")) {
    const escaped = pat
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`, "i").test(normalized);
  }

  return (
    normalized === pat ||
    normalized.endsWith(`/${pat}`) ||
    normalized.toLowerCase().endsWith(`/${pat.toLowerCase()}`) ||
    normalized.split("/").pop()?.toLowerCase() === pat.toLowerCase()
  );
}

export function shouldIgnoreFile(
  filename: string,
  patterns: string[] = DEFAULT_IGNORE_PATTERNS,
): boolean {
  return patterns.some((pattern) => matchGlob(filename, pattern));
}

/**
 * Scores files so oversized PRs keep the most review-relevant ones.
 * Source code with more changes ranks higher than docs/config.
 */
function relevanceScore(file: DiffFile): number {
  const name = file.filename.toLowerCase();
  let score = file.changes;

  if (/\.(ts|tsx|js|jsx|py|go|rs|java|kt|rb|php|cs)$/.test(name)) {
    score += 50;
  }
  if (name.includes("test") || name.includes("spec")) {
    score += 10;
  }
  if (name.endsWith(".md") || name.includes("docs/")) {
    score -= 20;
  }
  if (name.includes(".github/") || name.endsWith(".yml") || name.endsWith(".yaml")) {
    score -= 5;
  }

  return score;
}

/**
 * Filters lockfiles/binaries/generated files and enforces size limits.
 */
export function filterDiffFiles(
  files: DiffFile[],
  options?: {
    ignorePatterns?: string[];
    maxDiffChars?: number;
    maxFiles?: number;
    maxFileChars?: number;
  },
): FilteredDiff {
  const ignorePatterns = options?.ignorePatterns ?? DEFAULT_IGNORE_PATTERNS;
  const maxDiffChars = options?.maxDiffChars ?? MAX_DIFF_CHARS;
  const maxFiles = options?.maxFiles ?? MAX_FILES_TO_ANALYZE;
  const maxFileChars = options?.maxFileChars ?? MAX_FILE_DIFF_CHARS;

  const ignoredFiles: string[] = [];
  const candidates: DiffFile[] = [];

  for (const file of files) {
    if (shouldIgnoreFile(file.filename, ignorePatterns)) {
      ignoredFiles.push(file.filename);
      continue;
    }

    // Files without a textual patch (binaries / too large for GitHub patch) are skipped
    if (!file.patch) {
      ignoredFiles.push(file.filename);
      continue;
    }

    const patch =
      file.patch.length > maxFileChars
        ? `${file.patch.slice(0, maxFileChars)}\n\n… [truncated for size]`
        : file.patch;

    candidates.push({ ...file, patch });
  }

  candidates.sort((a, b) => relevanceScore(b) - relevanceScore(a));

  const selected: DiffFile[] = [];
  let totalChars = 0;
  let truncated = false;
  let truncationReason: string | undefined;

  for (const file of candidates) {
    if (selected.length >= maxFiles) {
      truncated = true;
      truncationReason = `Limited to the ${maxFiles} most relevant files`;
      break;
    }

    const size = file.patch?.length ?? 0;
    if (totalChars + size > maxDiffChars) {
      truncated = true;
      truncationReason =
        truncationReason ??
        `Diff exceeds ${maxDiffChars.toLocaleString()} characters — analyzing a subset`;
      break;
    }

    selected.push(file);
    totalChars += size;
  }

  return {
    files: selected,
    totalChars,
    ignoredFiles,
    truncated,
    truncationReason,
  };
}

/** Builds a compact unified-diff style string for the model. */
export function buildDiffText(files: DiffFile[]): string {
  return files
    .map((file) => {
      const header = `--- a/${file.filename}\n+++ b/${file.filename}\n# status: ${file.status} (+${file.additions}/-${file.deletions})`;
      return `${header}\n${file.patch ?? ""}`;
    })
    .join("\n\n");
}
