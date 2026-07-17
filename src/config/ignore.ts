/**
 * Default ignore patterns for files that rarely add review value
 * and inflate token cost (lockfiles, binaries, generated assets).
 */
export const DEFAULT_IGNORE_PATTERNS: string[] = [
  // Lockfiles
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "Cargo.lock",
  "Gemfile.lock",
  "poetry.lock",
  "composer.lock",
  // Dependencies / build output
  "node_modules/",
  "dist/",
  "build/",
  ".next/",
  "out/",
  "coverage/",
  "vendor/",
  // Source maps & minified
  "*.min.js",
  "*.min.css",
  "*.map",
  // Binaries & media
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.webp",
  "*.ico",
  "*.svg",
  "*.pdf",
  "*.zip",
  "*.tar",
  "*.gz",
  "*.woff",
  "*.woff2",
  "*.ttf",
  "*.eot",
  "*.mp4",
  "*.mp3",
  "*.exe",
  "*.dll",
  "*.so",
  "*.dylib",
  // Generated / large config dumps
  "*.generated.*",
  "*.pb.go",
  "*.pb.ts",
  "graphql.schema.json",
];

/** Soft cap on total filtered diff characters sent to the model. */
export const MAX_DIFF_CHARS = 60_000;

/** Prefer at most this many files when the PR is oversized. */
export const MAX_FILES_TO_ANALYZE = 25;

/** Per-file soft cap before truncation. */
export const MAX_FILE_DIFF_CHARS = 12_000;
