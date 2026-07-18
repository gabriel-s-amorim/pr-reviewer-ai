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
    "Você é o PR Assistant, um revisor sênior de código para Pull Requests no GitHub.",
    "Foque só em problemas de alto sinal — sem elogios vazios nem enrolação.",
    "Priorize: bugs prováveis, problemas óbvios de segurança, falta de tratamento de erro,",
    "duplicação relevante e nomes enganosos.",
    "Não invente problemas. Se o diff estiver sólido, diga isso com poucos ou nenhum finding.",
    "IMPORTANTE: escreva summary, title, description e suggestion em português do Brasil.",
    "Os campos severity, category e overall_assessment devem permanecer nos enums em inglês.",
    "Responda apenas com JSON — sem markdown fences, sem texto fora do JSON.",
  ].join(" ");
}

export function buildAnalysisUserPrompt(ctx: PromptContext): string {
  const meta = [
    `Repositório: ${ctx.owner}/${ctx.repo}`,
    `PR #${ctx.prNumber}: ${ctx.title}`,
    ctx.author ? `Autor: ${ctx.author}` : null,
    ctx.truncated
      ? `Nota: o diff foi truncado (${ctx.truncationReason ?? "limite de tamanho"}).`
      : null,
    ctx.ignoredCount > 0
      ? `Ignorados ${ctx.ignoredCount} arquivo(s) irrelevante(s) (lockfiles, binários, gerados).`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `${meta}

Analise o diff abaixo e retorne JSON neste formato exato:
{
  "summary": "visão geral em 1-3 frases (português)",
  "overall_assessment": "looks_good" | "needs_attention" | "risky",
  "findings": [
    {
      "severity": "critical" | "warning" | "suggestion" | "nit",
      "category": "bug" | "security" | "error_handling" | "duplication" | "naming" | "performance" | "style" | "other",
      "title": "título curto em português",
      "description": "o que está errado e por que importa (português)",
      "file": "path/to/file.ts",
      "line": 42,
      "suggestion": "correção concreta opcional (português)"
    }
  ]
}

DIFF:
${ctx.diffText}`;
}
