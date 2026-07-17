import type { AnalysisResult, Finding } from "@/lib/ai/schema";

const SEVERITY_EMOJI: Record<Finding["severity"], string> = {
  critical: "🚨",
  warning: "⚠️",
  suggestion: "💡",
  nit: "✨",
};

const ASSESSMENT_LABEL: Record<AnalysisResult["overall_assessment"], string> = {
  looks_good: "✅ Looks good",
  needs_attention: "👀 Needs attention",
  risky: "🛑 Risky — please review carefully",
};

function formatFinding(finding: Finding, index: number): string {
  const location = [
    finding.file ? `\`${finding.file}\`` : null,
    finding.line ? `L${finding.line}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const lines = [
    `### ${index + 1}. ${SEVERITY_EMOJI[finding.severity]} ${finding.title}`,
    "",
    `**Severity:** ${finding.severity} · **Category:** ${finding.category}`,
  ];

  if (location) {
    lines.push(`**Where:** ${location}`);
  }

  lines.push("", finding.description);

  if (finding.suggestion) {
    lines.push("", `**Suggestion:** ${finding.suggestion}`);
  }

  return lines.join("\n");
}

export type FormatCommentOptions = {
  truncated?: boolean;
  truncationReason?: string;
  dryRun?: boolean;
  modelLabel?: string;
};

/**
 * Turns structured AI JSON into a readable Markdown PR comment.
 */
export function formatReviewComment(
  analysis: AnalysisResult,
  options: FormatCommentOptions = {},
): string {
  const header = [
    "## 🤖 PR Assistant Review",
    "",
    `**Assessment:** ${ASSESSMENT_LABEL[analysis.overall_assessment]}`,
    "",
    analysis.summary,
  ];

  if (options.truncated) {
    header.push(
      "",
      `> ⚠️ **Partial analysis:** ${
        options.truncationReason ??
        "This PR is large — only the most relevant files were reviewed."
      }`,
    );
  }

  if (options.dryRun) {
    header.push(
      "",
      "> 🧪 **Dry-run mode** — comment was not posted to GitHub.",
    );
  }

  const body: string[] = [...header, ""];

  if (analysis.findings.length === 0) {
    body.push("_No high-signal issues found in the reviewed diff._");
  } else {
    body.push(`### Findings (${analysis.findings.length})`, "");
    body.push(
      analysis.findings
        .map((finding, index) => formatFinding(finding, index))
        .join("\n\n"),
    );
  }

  body.push(
    "",
    "---",
    "_Automated review by **PR Assistant**. Treat suggestions as hints, not merge blockers._",
  );

  if (options.modelLabel) {
    body.push(`_Model: ${options.modelLabel}_`);
  }

  return body.join("\n");
}
