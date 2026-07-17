import { describe, expect, it } from "vitest";
import { formatReviewComment } from "@/lib/review/format-comment";
import type { AnalysisResult } from "@/lib/ai/schema";

const mockAnalysis: AnalysisResult = {
  summary: "The PR adds a fetch helper but misses error handling.",
  overall_assessment: "needs_attention",
  findings: [
    {
      severity: "warning",
      category: "error_handling",
      title: "Missing non-OK response handling",
      description: "fetchUser ignores HTTP status codes before parsing JSON.",
      file: "src/utils/fetchUser.ts",
      line: 4,
      suggestion: "Check res.ok and throw or return a typed error.",
    },
    {
      severity: "suggestion",
      category: "duplication",
      title: "Duplicated name formatting",
      description: "formatName and formatNameDup share the same logic.",
      file: "src/utils/fetchUser.ts",
    },
  ],
};

describe("formatReviewComment", () => {
  it("formats structured AI findings into readable Markdown", () => {
    const markdown = formatReviewComment(mockAnalysis, {
      modelLabel: "claude-test",
    });

    expect(markdown).toContain("## 🤖 PR Assistant Review");
    expect(markdown).toContain("Needs attention");
    expect(markdown).toContain("Missing non-OK response handling");
    expect(markdown).toContain("`src/utils/fetchUser.ts`");
    expect(markdown).toContain("L4");
    expect(markdown).toContain("Check res.ok");
    expect(markdown).toContain("Duplicated name formatting");
    expect(markdown).toContain("Model: claude-test");
  });

  it("mentions truncation when the PR was partially analyzed", () => {
    const markdown = formatReviewComment(mockAnalysis, {
      truncated: true,
      truncationReason: "Diff too large",
    });

    expect(markdown).toContain("Partial analysis");
    expect(markdown).toContain("Diff too large");
  });

  it("handles empty findings", () => {
    const markdown = formatReviewComment({
      summary: "Looks clean.",
      overall_assessment: "looks_good",
      findings: [],
    });

    expect(markdown).toContain("Looks good");
    expect(markdown).toContain("No high-signal issues");
  });
});
