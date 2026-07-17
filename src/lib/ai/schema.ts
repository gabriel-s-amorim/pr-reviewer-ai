import { z } from "zod";

export const findingSchema = z.object({
  severity: z.enum(["critical", "warning", "suggestion", "nit"]),
  category: z.enum([
    "bug",
    "security",
    "error_handling",
    "duplication",
    "naming",
    "performance",
    "style",
    "other",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  suggestion: z.string().optional(),
});

export const analysisSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(findingSchema),
  overall_assessment: z.enum(["looks_good", "needs_attention", "risky"]),
});

export type Finding = z.infer<typeof findingSchema>;
export type AnalysisResult = z.infer<typeof analysisSchema>;

export function parseAnalysisJson(raw: string): AnalysisResult {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed = JSON.parse(cleaned) as unknown;
  return analysisSchema.parse(parsed);
}
