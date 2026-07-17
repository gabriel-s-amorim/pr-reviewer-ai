import { describe, expect, it } from "vitest";
import {
  signPayload,
  verifyGitHubSignature,
} from "@/lib/github/signature";

describe("verifyGitHubSignature", () => {
  const secret = "test-webhook-secret";
  const payload = JSON.stringify({ action: "opened", zen: "hello" });

  it("accepts a valid HMAC signature", () => {
    const signature = signPayload(payload, secret);
    expect(verifyGitHubSignature(payload, signature, secret)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const signature = signPayload(payload, secret);
    const tampered = payload.replace("opened", "closed");
    expect(verifyGitHubSignature(tampered, signature, secret)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const signature = signPayload(payload, secret);
    expect(verifyGitHubSignature(payload, signature, "other-secret")).toBe(
      false,
    );
  });

  it("rejects a missing signature header", () => {
    expect(verifyGitHubSignature(payload, null, secret)).toBe(false);
  });

  it("rejects a malformed signature header", () => {
    expect(verifyGitHubSignature(payload, "not-a-signature", secret)).toBe(
      false,
    );
  });
});
