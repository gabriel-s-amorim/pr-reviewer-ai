import { describe, expect, it } from "vitest";
import {
  filterDiffFiles,
  shouldIgnoreFile,
  type DiffFile,
} from "@/lib/diff/filter";

const files: DiffFile[] = [
  {
    filename: "src/app.ts",
    status: "modified",
    additions: 10,
    deletions: 2,
    changes: 12,
    patch: "@@ -1 +1 @@\n+console.log('hi')\n".repeat(5),
  },
  {
    filename: "package-lock.json",
    status: "modified",
    additions: 1000,
    deletions: 10,
    changes: 1010,
    patch: "+lockfile junk",
  },
  {
    filename: "pnpm-lock.yaml",
    status: "modified",
    additions: 500,
    deletions: 5,
    changes: 505,
    patch: "+pnpm junk",
  },
  {
    filename: "assets/logo.png",
    status: "added",
    additions: 0,
    deletions: 0,
    changes: 0,
    // binaries often have no patch
  },
  {
    filename: "dist/bundle.min.js",
    status: "modified",
    additions: 1,
    deletions: 1,
    changes: 2,
    patch: "+minified",
  },
];

describe("shouldIgnoreFile", () => {
  it("ignores lockfiles", () => {
    expect(shouldIgnoreFile("package-lock.json")).toBe(true);
    expect(shouldIgnoreFile("apps/web/pnpm-lock.yaml")).toBe(true);
    expect(shouldIgnoreFile("yarn.lock")).toBe(true);
  });

  it("ignores binaries and minified assets", () => {
    expect(shouldIgnoreFile("public/hero.png")).toBe(true);
    expect(shouldIgnoreFile("vendor/lib.min.js")).toBe(true);
  });

  it("keeps source files", () => {
    expect(shouldIgnoreFile("src/lib/review/process-pr.ts")).toBe(false);
  });
});

describe("filterDiffFiles", () => {
  it("drops lockfiles, binaries, and minified files", () => {
    const result = filterDiffFiles(files);
    expect(result.files.map((f) => f.filename)).toEqual(["src/app.ts"]);
    expect(result.ignoredFiles).toEqual(
      expect.arrayContaining([
        "package-lock.json",
        "pnpm-lock.yaml",
        "assets/logo.png",
        "dist/bundle.min.js",
      ]),
    );
  });

  it("truncates oversized diffs", () => {
    const huge: DiffFile[] = [
      {
        filename: "src/a.ts",
        status: "modified",
        additions: 100,
        deletions: 0,
        changes: 100,
        patch: "a".repeat(8_000),
      },
      {
        filename: "src/b.ts",
        status: "modified",
        additions: 100,
        deletions: 0,
        changes: 100,
        patch: "b".repeat(8_000),
      },
    ];

    // Per-file cap is high enough; total budget forces a subset
    const result = filterDiffFiles(huge, {
      maxDiffChars: 10_000,
      maxFileChars: 20_000,
    });
    expect(result.truncated).toBe(true);
    expect(result.files.length).toBeLessThan(huge.length);
  });
});
