import { createHmac, timingSafeEqual } from "crypto";

/**
 * Validates GitHub webhook signatures (X-Hub-Signature-256).
 * Same HMAC-SHA256 + timing-safe compare pattern used for payment webhooks.
 */
export function signPayload(payload: string, secret: string): string {
  const digest = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `sha256=${digest}`;
}

export function verifyGitHubSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) {
    return false;
  }

  const expected = signPayload(payload, secret);

  try {
    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(signatureHeader, "utf8");

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}
