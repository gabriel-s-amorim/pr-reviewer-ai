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
    summary: `Análise dry-run de ${ctx.owner}/${ctx.repo}#${ctx.prNumber} ("${ctx.title}"). Nenhuma chamada externa à IA foi feita.`,
    overall_assessment: "needs_attention",
    findings: [
      {
        severity: "warning",
        category: "error_handling",
        title: "Exemplo: falta tratamento de erro",
        description:
          "Finding de exemplo gerado no modo dry-run para validar a formatação do comentário de ponta a ponta.",
        file: ctx.diffText.includes("src/")
          ? "src/example.ts"
          : undefined,
        suggestion: "Envolva a chamada falível em try/catch e retorne um erro tipado.",
      },
      {
        severity: "suggestion",
        category: "naming",
        title: "Exemplo: esclareça nomes de variáveis",
        description:
          "Prefira nomes descritivos a abreviações para facilitar a leitura em reviews futuros.",
      },
    ],
  };
}
