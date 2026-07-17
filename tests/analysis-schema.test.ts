import { describe, expect, it } from "vitest";
import { parseAnalysisJson } from "@/lib/ai/schema";

describe("parseAnalysisJson", () => {
  it("parses raw JSON", () => {
    const result = parseAnalysisJson(
      JSON.stringify({
        summary: "ok",
        overall_assessment: "looks_good",
        findings: [],
      }),
    );
    expect(result.overall_assessment).toBe("looks_good");
  });

  it("strips markdown fences if the model wraps JSON", () => {
    const result = parseAnalysisJson(`\`\`\`json
{"summary":"ok","overall_assessment":"risky","findings":[]}
\`\`\``);
    expect(result.overall_assessment).toBe("risky");
  });
});
