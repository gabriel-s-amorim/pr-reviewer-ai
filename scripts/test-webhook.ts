/**
 * Simulates a GitHub webhook delivery against the local Next.js server.
 *
 * Usage:
 *   1. Copy .env.example → .env.local
 *   2. Set GITHUB_WEBHOOK_SECRET + PR_ASSISTANT_DRY_RUN=true
 *   3. pnpm dev   (in another terminal)
 *   4. pnpm test:webhook
 */

import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

const WEBHOOK_URL =
  process.env.WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/github";
const SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? "dev-webhook-secret";
const FIXTURE =
  process.env.WEBHOOK_FIXTURE ??
  resolve(process.cwd(), "fixtures/pull_request.opened.json");

function sign(payload: string, secret: string): string {
  const digest = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `sha256=${digest}`;
}

async function main() {
  const payload = readFileSync(FIXTURE, "utf8");
  const signature = sign(payload, SECRET);

  console.log(`→ POST ${WEBHOOK_URL}`);
  console.log(`→ Fixture: ${FIXTURE}`);
  console.log(`→ Signature: ${signature.slice(0, 18)}…`);

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "pull_request",
      "X-GitHub-Delivery": `local-test-${Date.now()}`,
      "X-Hub-Signature-256": signature,
      "User-Agent": "GitHub-Hookshot/local-test",
    },
    body: payload,
  });

  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    // keep raw text
  }

  console.log(`← Status: ${response.status}`);
  console.log("← Body:");
  console.log(JSON.stringify(body, null, 2));

  if (typeof body === "object" && body && "commentBody" in body) {
    console.log("\n── Formatted PR comment (dry-run) ──\n");
    console.log((body as { commentBody: string }).commentBody);
  }

  if (!response.ok) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
