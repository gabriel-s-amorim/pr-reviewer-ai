import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@/lib/env";
import {
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  type PromptContext,
} from "@/lib/ai/prompt";
import { parseAnalysisJson, type AnalysisResult } from "@/lib/ai/schema";

export async function analyzePullRequestDiff(
  ctx: PromptContext,
): Promise<AnalysisResult> {
  const env = getEnv();
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: buildAnalysisSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildAnalysisUserPrompt(ctx),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic response contained no text content");
  }

  try {
    return parseAnalysisJson(textBlock.text);
  } catch (error) {
    throw new Error(
      `Failed to parse structured analysis from Claude: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
}

/** Deterministic mock used by dry-run / local fixture flows. */
export function mockAnalyzePullRequestDiff(ctx: PromptContext): AnalysisResult {
  return {
    summary: `Dry-run analysis for ${ctx.owner}/${ctx.repo}#${ctx.prNumber} ("${ctx.title}"). No external AI call was made.`,
    overall_assessment: "needs_attention",
    findings: [
      {
        severity: "warning",
        category: "error_handling",
        title: "Example: missing error handling",
        description:
          "This is a sample finding generated in dry-run mode so you can verify comment formatting end-to-end.",
        file: ctx.diffText.includes("src/")
          ? "src/example.ts"
          : undefined,
        suggestion: "Wrap the fallible call in try/catch and return a typed error.",
      },
      {
        severity: "suggestion",
        category: "naming",
        title: "Example: clarify variable names",
        description:
          "Prefer descriptive names over abbreviations so future reviewers understand intent quickly.",
      },
    ],
  };
}
