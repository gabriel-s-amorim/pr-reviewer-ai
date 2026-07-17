import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  isRelevantPullRequestAction,
  parseWebhookEvent,
} from "@/lib/github/events";

const fixture = JSON.parse(
  readFileSync(
    resolve(__dirname, "../fixtures/pull_request.opened.json"),
    "utf8",
  ),
) as unknown;

describe("parseWebhookEvent", () => {
  it("accepts pull_request opened", () => {
    const result = parseWebhookEvent("pull_request", fixture);
    expect(result.kind).toBe("pull_request");
    if (result.kind === "pull_request") {
      expect(result.action).toBe("opened");
      expect(result.payload.pull_request.number).toBe(42);
    }
  });

  it("accepts pull_request synchronize", () => {
    const result = parseWebhookEvent("pull_request", {
      ...(fixture as object),
      action: "synchronize",
    });
    expect(result.kind).toBe("pull_request");
    if (result.kind === "pull_request") {
      expect(result.action).toBe("synchronize");
    }
  });

  it("ignores pull_request closed", () => {
    const result = parseWebhookEvent("pull_request", {
      ...(fixture as object),
      action: "closed",
    });
    expect(result.kind).toBe("ignored");
    if (result.kind === "ignored") {
      expect(result.reason).toMatch(/closed/i);
    }
  });

  it("ignores non pull_request events", () => {
    const result = parseWebhookEvent("push", fixture);
    expect(result.kind).toBe("ignored");
  });

  it("ignores missing event name", () => {
    const result = parseWebhookEvent(null, fixture);
    expect(result.kind).toBe("ignored");
  });
});

describe("isRelevantPullRequestAction", () => {
  it("allows opened and synchronize only", () => {
    expect(isRelevantPullRequestAction("opened")).toBe(true);
    expect(isRelevantPullRequestAction("synchronize")).toBe(true);
    expect(isRelevantPullRequestAction("edited")).toBe(false);
    expect(isRelevantPullRequestAction("reopened")).toBe(false);
  });
});
