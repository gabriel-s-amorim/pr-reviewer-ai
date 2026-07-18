/**
 * Captures a clean screenshot of the PR Assistant bot comment on a GitHub PR.
 *
 * Usage:
 *   CAPTURE_PR_URL="https://github.com/owner/repo/pull/1" pnpm capture:pr-review
 *
 * Optional:
 *   CAPTURE_BOT_TEXT="Review do PR Assistant"   # text to locate the comment
 *   CAPTURE_TIMEOUT_MS=180000                   # wait for comment (default 3 min)
 *   CAPTURE_OUT=docs/screenshots/custom.png     # override output path
 */

import { mkdirSync } from "fs";
import { resolve } from "path";
import { chromium } from "playwright";

const PR_URL = process.env.CAPTURE_PR_URL;
const BOT_TEXT =
  process.env.CAPTURE_BOT_TEXT ?? "Review do PR Assistant";
const TIMEOUT_MS = Number(process.env.CAPTURE_TIMEOUT_MS ?? 180_000);

function datedOutputPath(): string {
  if (process.env.CAPTURE_OUT) {
    return resolve(process.cwd(), process.env.CAPTURE_OUT);
  }

  const today = new Date().toISOString().slice(0, 10);
  return resolve(
    process.cwd(),
    "docs",
    "screenshots",
    `pr-review-${today}.png`,
  );
}

async function main() {
  if (!PR_URL) {
    console.error(
      "Missing CAPTURE_PR_URL.\n" +
        'Example: CAPTURE_PR_URL="https://github.com/owner/repo/pull/1" pnpm capture:pr-review',
    );
    process.exit(1);
  }

  const outPath = datedOutputPath();
  mkdirSync(resolve(process.cwd(), "docs", "screenshots"), { recursive: true });

  console.log(`→ Opening ${PR_URL}`);
  console.log(`→ Waiting for comment containing: "${BOT_TEXT}"`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1400 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });

  try {
    await page.goto(PR_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });

    // GitHub sometimes lazy-loads the conversation; scroll a bit to encourage it
    await page.evaluate(() => window.scrollBy(0, 400));

    const comment = page
      .locator(".timeline-comment, .review-comment, [id^='issuecomment-']")
      .filter({ hasText: BOT_TEXT })
      .first();

    await comment.waitFor({ state: "visible", timeout: TIMEOUT_MS });

    // Prefer the markdown body for a tighter crop; fall back to the whole comment card
    const body = comment.locator(".comment-body, .markdown-body").first();
    const target = (await body.count()) > 0 ? body : comment;

    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await target.screenshot({
      path: outPath,
      type: "png",
    });

    console.log(`✓ Saved ${outPath}`);
    console.log(
      "Tip: copy/rename the best capture to docs/screenshots/pr-review-example.png for the README.",
    );
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
