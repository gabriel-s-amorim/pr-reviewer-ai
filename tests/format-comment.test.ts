import { describe, expect, it } from "vitest";
import { formatReviewComment } from "@/lib/review/format-comment";
import type { AnalysisResult } from "@/lib/ai/schema";

const mockAnalysis: AnalysisResult = {
  summary: "O PR adiciona um helper de fetch, mas falha no tratamento de erro.",
  overall_assessment: "needs_attention",
  findings: [
    {
      severity: "warning",
      category: "error_handling",
      title: "Falta checagem de resposta não-OK",
      description: "fetchUser ignora o status HTTP antes de fazer parse do JSON.",
      file: "src/utils/fetchUser.ts",
      line: 4,
      suggestion: "Verifique res.ok e lance ou retorne um erro tipado.",
    },
    {
      severity: "suggestion",
      category: "duplication",
      title: "Formatação de nome duplicada",
      description: "formatName e formatNameDup compartilham a mesma lógica.",
      file: "src/utils/fetchUser.ts",
    },
  ],
};

describe("formatReviewComment", () => {
  it("formats structured AI findings into readable Markdown", () => {
    const markdown = formatReviewComment(mockAnalysis, {
      modelLabel: "claude-test",
    });

    expect(markdown).toContain("## 🤖 Review do PR Assistant");
    expect(markdown).toContain("Precisa de atenção");
    expect(markdown).toContain("Falta checagem de resposta não-OK");
    expect(markdown).toContain("`src/utils/fetchUser.ts`");
    expect(markdown).toContain("L4");
    expect(markdown).toContain("Verifique res.ok");
    expect(markdown).toContain("Formatação de nome duplicada");
    expect(markdown).toContain("Modelo: claude-test");
  });

  it("mentions truncation when the PR was partially analyzed", () => {
    const markdown = formatReviewComment(mockAnalysis, {
      truncated: true,
      truncationReason: "Diff muito grande",
    });

    expect(markdown).toContain("Análise parcial");
    expect(markdown).toContain("Diff muito grande");
  });

  it("handles empty findings", () => {
    const markdown = formatReviewComment({
      summary: "Parece limpo.",
      overall_assessment: "looks_good",
      findings: [],
    });

    expect(markdown).toContain("Parece bom");
    expect(markdown).toContain("Nenhum problema de alto sinal");
  });
});
