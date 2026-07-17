export type PromptContext = {
  owner: string;
  repo: string;
  prNumber: number;
  title: string;
  author?: string;
  diffText: string;
  truncated: boolean;
  truncationReason?: string;
  ignoredCount: number;
};

export function buildAnalysisSystemPrompt(): string {
  return [
    "You are PR Assistant, a senior code reviewer for GitHub pull requests.",
    "Focus on high-signal issues only — skip praise and filler.",
    "Prioritize: probable bugs, obvious security issues, missing error handling,",
    "meaningful duplication, and misleading names.",
    "Do not invent problems. If the diff looks solid, say so with few or no findings.",
    "Respond with JSON only — no markdown fences, no prose outside JSON.",
  ].join(" ");
}

export function buildAnalysisUserPrompt(ctx: PromptContext): string {
  const meta = [
    `Repository: ${ctx.owner}/${ctx.repo}`,
    `PR #${ctx.prNumber}: ${ctx.title}`,
    ctx.author ? `Author: ${ctx.author}` : null,
    ctx.truncated
      ? `Note: diff was truncated (${ctx.truncationReason ?? "size limit"}).`
      : null,
    ctx.ignoredCount > 0
      ? `Ignored ${ctx.ignoredCount} irrelevant file(s) (lockfiles, binaries, generated).`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `${meta}

Analyze the following pull request diff and return JSON with this exact shape:
{
  "summary": "1-3 sentence overview",
  "overall_assessment": "looks_good" | "needs_attention" | "risky",
  "findings": [
    {
      "severity": "critical" | "warning" | "suggestion" | "nit",
      "category": "bug" | "security" | "error_handling" | "duplication" | "naming" | "performance" | "style" | "other",
      "title": "short title",
      "description": "what is wrong and why it matters",
      "file": "path/to/file.ts",
      "line": 42,
      "suggestion": "optional concrete fix"
    }
  ]
}

DIFF:
${ctx.diffText}`;
}
