import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { verifyGitHubSignature } from "@/lib/github/signature";
import { parseWebhookEvent } from "@/lib/github/events";
import { processPullRequest } from "@/lib/review/process-pr";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GitHub App webhook entrypoint.
 * Security order: verify HMAC → parse/filter event → process PR.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  let env: ReturnType<typeof getEnv>;
  try {
    env = getEnv();
  } catch (error) {
    console.error(
      JSON.stringify({
        msg: "pr_assistant.env_error",
        error: error instanceof Error ? error.message : "unknown",
      }),
    );
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyGitHubSignature(rawBody, signature, env.GITHUB_WEBHOOK_SECRET)) {
    console.warn(JSON.stringify({ msg: "pr_assistant.invalid_signature" }));
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = request.headers.get("x-github-event");
  const parsed = parseWebhookEvent(eventName, body);

  if (parsed.kind === "ignored") {
    return NextResponse.json({
      ok: true,
      status: "ignored",
      reason: parsed.reason,
    });
  }

  try {
    const result = await processPullRequest(parsed.payload);

    if (result.status === "skipped") {
      return NextResponse.json({
        ok: true,
        status: "skipped",
        reason: result.reason,
      });
    }

    return NextResponse.json({
      ok: true,
      status: "reviewed",
      dryRun: result.dryRun,
      filesAnalyzed: result.filesAnalyzed,
      filesIgnored: result.filesIgnored,
      truncated: result.truncated,
      commentUrl: result.commentUrl,
      // Include formatted comment only in dry-run so local testing is visible
      ...(result.dryRun ? { commentBody: result.commentBody } : {}),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        msg: "pr_assistant.process_error",
        error: error instanceof Error ? error.message : "unknown",
      }),
    );

    return NextResponse.json(
      { error: "Failed to process pull request" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "pr-assistant",
    endpoint: "/api/webhooks/github",
    hint: "GitHub App webhooks must POST here with a valid X-Hub-Signature-256.",
  });
}
