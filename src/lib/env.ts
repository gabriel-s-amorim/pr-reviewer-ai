import { z } from "zod";

/**
 * Normalizes PEM private keys stored in env vars.
 * Vercel / .env often need `\n` escaped as literal two-char sequences.
 */
export function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.includes("BEGIN") && trimmed.includes("\n")) {
    return trimmed;
  }

  if (trimmed.includes("\\n")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    if (decoded.includes("BEGIN")) {
      return decoded;
    }
  } catch {
    // not base64 — fall through
  }

  return trimmed;
}

const boolFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GITHUB_WEBHOOK_SECRET: z.string().min(1, "GITHUB_WEBHOOK_SECRET is required"),
  PR_ASSISTANT_DRY_RUN: boolFromEnv,
  DIFF_IGNORE_PATTERNS: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-20250514"),

  // Optional in dry-run; required otherwise
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type Env = {
  NODE_ENV: "development" | "test" | "production";
  GITHUB_WEBHOOK_SECRET: string;
  PR_ASSISTANT_DRY_RUN: boolean;
  DIFF_IGNORE_PATTERNS?: string;
  ANTHROPIC_MODEL: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  githubAppPrivateKey: string;
  ANTHROPIC_API_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
};

let cached: Env | null = null;

function requireField(
  value: string | undefined,
  name: string,
  dryRun: boolean,
): string {
  if (dryRun) {
    return value ?? `dry-run-placeholder-${name.toLowerCase()}`;
  }
  if (!value || value.trim() === "") {
    throw new Error(`${name} is required when PR_ASSISTANT_DRY_RUN is not true`);
  }
  return value;
}

/**
 * Validates required env vars and fails fast with a clear message.
 * Lazy — safe for Next.js builds where env may be absent at compile time.
 *
 * In dry-run mode only GITHUB_WEBHOOK_SECRET is strictly required so you can
 * exercise the webhook locally before creating a real GitHub App.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = baseSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Missing or invalid environment variables:\n${details}\n\n` +
        `Copy .env.example to .env.local and fill in the values. ` +
        `See README.md → "Guia de configuração".`,
    );
  }

  const data = parsed.data;
  const dryRun = data.PR_ASSISTANT_DRY_RUN;

  try {
    if (!dryRun) {
      if (!data.UPSTASH_REDIS_REST_URL?.startsWith("http")) {
        throw new Error("UPSTASH_REDIS_REST_URL must be a valid URL");
      }
    }

    const appId = requireField(data.GITHUB_APP_ID, "GITHUB_APP_ID", dryRun);
    const privateKeyRaw = requireField(
      data.GITHUB_APP_PRIVATE_KEY,
      "GITHUB_APP_PRIVATE_KEY",
      dryRun,
    );
    const anthropicKey = requireField(
      data.ANTHROPIC_API_KEY,
      "ANTHROPIC_API_KEY",
      dryRun,
    );
    const redisUrl = requireField(
      data.UPSTASH_REDIS_REST_URL,
      "UPSTASH_REDIS_REST_URL",
      dryRun,
    );
    const redisToken = requireField(
      data.UPSTASH_REDIS_REST_TOKEN,
      "UPSTASH_REDIS_REST_TOKEN",
      dryRun,
    );

    cached = {
      NODE_ENV: data.NODE_ENV,
      GITHUB_WEBHOOK_SECRET: data.GITHUB_WEBHOOK_SECRET,
      PR_ASSISTANT_DRY_RUN: dryRun,
      DIFF_IGNORE_PATTERNS: data.DIFF_IGNORE_PATTERNS,
      ANTHROPIC_MODEL: data.ANTHROPIC_MODEL,
      GITHUB_APP_ID: appId,
      GITHUB_APP_PRIVATE_KEY: privateKeyRaw,
      githubAppPrivateKey: dryRun
        ? "DRY_RUN_NO_KEY"
        : normalizePrivateKey(privateKeyRaw),
      ANTHROPIC_API_KEY: anthropicKey,
      UPSTASH_REDIS_REST_URL: redisUrl,
      UPSTASH_REDIS_REST_TOKEN: redisToken,
    };

    return cached;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Missing or invalid environment variables:\n  • ${message}\n\n` +
        `Copy .env.example to .env.local and fill in the values. ` +
        `For local fixture testing set PR_ASSISTANT_DRY_RUN=true ` +
        `(only GITHUB_WEBHOOK_SECRET is required).`,
    );
  }
}

/** Test helper — clears the cached env between cases. */
export function resetEnvCache(): void {
  cached = null;
}

export function getWebhookSecret(): string {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("GITHUB_WEBHOOK_SECRET is required");
  }
  return secret;
}
