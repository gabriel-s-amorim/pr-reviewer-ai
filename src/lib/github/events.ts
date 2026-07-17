import { z } from "zod";

const RELEVANT_ACTIONS = ["opened", "synchronize"] as const;

const repositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({
    login: z.string(),
  }),
});

const pullRequestSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().nullable().optional(),
  html_url: z.string().url(),
  head: z.object({
    sha: z.string(),
    ref: z.string(),
  }),
  base: z.object({
    ref: z.string(),
  }),
  user: z
    .object({
      login: z.string(),
    })
    .optional(),
  additions: z.number().optional(),
  deletions: z.number().optional(),
  changed_files: z.number().optional(),
});

const installationSchema = z.object({
  id: z.number(),
});

export const pullRequestWebhookSchema = z.object({
  action: z.string(),
  number: z.number().optional(),
  pull_request: pullRequestSchema,
  repository: repositorySchema,
  installation: installationSchema.optional(),
  sender: z
    .object({
      login: z.string(),
      type: z.string().optional(),
    })
    .optional(),
});

export type PullRequestWebhook = z.infer<typeof pullRequestWebhookSchema>;

export type ParsedWebhookEvent =
  | { kind: "ignored"; reason: string }
  | {
      kind: "pull_request";
      action: (typeof RELEVANT_ACTIONS)[number];
      payload: PullRequestWebhook;
    };

/**
 * Filters webhook events: only `pull_request` with action opened/synchronize.
 */
export function parseWebhookEvent(
  eventName: string | null,
  body: unknown,
): ParsedWebhookEvent {
  if (eventName !== "pull_request") {
    return {
      kind: "ignored",
      reason: `Unsupported event: ${eventName ?? "missing X-GitHub-Event"}`,
    };
  }

  const parsed = pullRequestWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return {
      kind: "ignored",
      reason: `Invalid pull_request payload: ${parsed.error.issues[0]?.message ?? "parse error"}`,
    };
  }

  const action = parsed.data.action;
  if (!RELEVANT_ACTIONS.includes(action as (typeof RELEVANT_ACTIONS)[number])) {
    return {
      kind: "ignored",
      reason: `Ignored pull_request action: ${action}`,
    };
  }

  // Skip bot-authored noise when the sender is clearly a bot (optional soft filter)
  if (parsed.data.sender?.type === "Bot" && parsed.data.sender.login.includes("dependabot")) {
    return {
      kind: "ignored",
      reason: "Ignored Dependabot PR (noise control)",
    };
  }

  return {
    kind: "pull_request",
    action: action as (typeof RELEVANT_ACTIONS)[number],
    payload: parsed.data,
  };
}

export function isRelevantPullRequestAction(action: string): boolean {
  return RELEVANT_ACTIONS.includes(action as (typeof RELEVANT_ACTIONS)[number]);
}
