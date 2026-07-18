import type { AnalysisResult, Finding } from "@/lib/ai/schema";

const SEVERITY_EMOJI: Record<Finding["severity"], string> = {
  critical: "🚨",
  warning: "⚠️",
  suggestion: "💡",
  nit: "✨",
};

const SEVERITY_LABEL: Record<Finding["severity"], string> = {
  critical: "crítica",
  warning: "aviso",
  suggestion: "sugestão",
  nit: "detalhe",
};

const CATEGORY_LABEL: Record<Finding["category"], string> = {
  bug: "bug",
  security: "segurança",
  error_handling: "tratamento de erro",
  duplication: "duplicação",
  naming: "nomenclatura",
  performance: "performance",
  style: "estilo",
  other: "outro",
};

const ASSESSMENT_LABEL: Record<AnalysisResult["overall_assessment"], string> = {
  looks_good: "✅ Parece bom",
  needs_attention: "👀 Precisa de atenção",
  risky: "🛑 Arriscado — revise com cuidado",
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
    `**Severidade:** ${SEVERITY_LABEL[finding.severity]} · **Categoria:** ${CATEGORY_LABEL[finding.category]}`,
  ];

  if (location) {
    lines.push(`**Onde:** ${location}`);
  }

  lines.push("", finding.description);

  if (finding.suggestion) {
    lines.push("", `**Sugestão:** ${finding.suggestion}`);
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
 * Turns structured AI JSON into a readable Markdown PR comment (PT-BR).
 */
export function formatReviewComment(
  analysis: AnalysisResult,
  options: FormatCommentOptions = {},
): string {
  const header = [
    "## 🤖 Review do PR Assistant",
    "",
    `**Avaliação:** ${ASSESSMENT_LABEL[analysis.overall_assessment]}`,
    "",
    analysis.summary,
  ];

  if (options.truncated) {
    header.push(
      "",
      `> ⚠️ **Análise parcial:** ${
        options.truncationReason ??
        "Este PR é grande — só os arquivos mais relevantes foram revisados."
      }`,
    );
  }

  if (options.dryRun) {
    header.push(
      "",
      "> 🧪 **Modo dry-run** — o comentário não foi postado no GitHub.",
    );
  }

  const body: string[] = [...header, ""];

  if (analysis.findings.length === 0) {
    body.push("_Nenhum problema de alto sinal encontrado no diff revisado._");
  } else {
    body.push(`### Achados (${analysis.findings.length})`, "");
    body.push(
      analysis.findings
        .map((finding, index) => formatFinding(finding, index))
        .join("\n\n"),
    );
  }

  body.push(
    "",
    "---",
    "_Review automatizado pelo **PR Assistant**. Trate as sugestões como dicas, não como bloqueio de merge._",
  );

  if (options.modelLabel) {
    body.push(`_Modelo: ${options.modelLabel}_`);
  }

  return body.join("\n");
}
