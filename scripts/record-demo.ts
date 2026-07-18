/**
 * Records a headed Playwright demo: open PR compare → Create PR → wait for
 * PR Assistant comment → save video + optional GIF for the README.
 *
 * Prerequisites:
 *   1. pnpm auth:github          (one-time, saves playwright/.auth/github.json)
 *   2. Push a test branch ahead of time
 *   3. Set DEMO_COMPARE_URL to the GitHub compare/new-PR URL
 *
 * Usage (PowerShell):
 *   $env:DEMO_COMPARE_URL="https://github.com/owner/repo/compare/main...branch?expand=1"
 *   pnpm record:demo
 */

import { execFileSync, spawnSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, renameSync } from "fs";
import { join, resolve } from "path";
import { chromium } from "playwright";

// ── Easy-to-edit PR copy ────────────────────────────────────────────────────
const PR_TITLE =
  process.env.DEMO_PR_TITLE ??
  "test: PR Assistant demo — intentional code issues";

const PR_BODY =
  process.env.DEMO_PR_BODY ??
  [
    "## Demo do PR Assistant",
    "",
    "Pull Request de teste com falhas intencionais de código para gravar a demo do bot.",
    "Pode fechar depois da gravação.",
  ].join("\n");

const BOT_TEXT = process.env.DEMO_BOT_TEXT ?? "Review do PR Assistant";
const COMMENT_TIMEOUT_MS = Number(process.env.DEMO_TIMEOUT_MS ?? 90_000);
const TRIM_START_SECONDS = Number(process.env.DEMO_TRIM_START ?? 2);

const AUTH_FILE = resolve(process.cwd(), "playwright", ".auth", "github.json");
const VIDEO_DIR = resolve(process.cwd(), "docs", "videos");
const GIF_PATH = resolve(
  process.cwd(),
  "docs",
  "screenshots",
  "pr-assistant-demo.gif",
);
const RAW_WEBM = resolve(VIDEO_DIR, "pr-assistant-demo-raw.webm");

function hasFfmpeg(): boolean {
  const result = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return result.status === 0;
}

function convertToGif(webmPath: string): void {
  mkdirSync(resolve(process.cwd(), "docs", "screenshots"), { recursive: true });

  // Palette + scale for a README-friendly looping GIF (~800px wide)
  const filter = [
    `trim=start=${TRIM_START_SECONDS}`,
    "setpts=PTS-STARTPTS",
    "fps=12",
    "scale=800:-1:flags=lanczos",
    "split[s0][s1]",
    "[s0]palettegen=max_colors=128:stats_mode=diff[p]",
    "[s1][p]paletteuse=dither=bayer:bayer_scale=3",
  ].join(",");

  execFileSync(
    "ffmpeg",
    ["-y", "-i", webmPath, "-vf", filter, "-loop", "0", GIF_PATH],
    { stdio: "inherit" },
  );

  console.log(`✓ GIF salvo em ${GIF_PATH}`);
}

async function main() {
  const compareUrl = process.env.DEMO_COMPARE_URL;
  if (!compareUrl) {
    console.error(
      "Missing DEMO_COMPARE_URL.\n" +
        'Example: $env:DEMO_COMPARE_URL="https://github.com/owner/repo/compare/main...branch?expand=1"',
    );
    process.exit(1);
  }

  if (!existsSync(AUTH_FILE)) {
    console.error(
      `Missing auth file: ${AUTH_FILE}\n` +
        "Run once: pnpm auth:github",
    );
    process.exit(1);
  }

  mkdirSync(VIDEO_DIR, { recursive: true });
  mkdirSync(resolve(process.cwd(), "docs", "screenshots"), { recursive: true });

  // Playwright writes video into a temp dir; we rename afterwards
  const recordDir = resolve(VIDEO_DIR, ".recording");
  mkdirSync(recordDir, { recursive: true });

  console.log("→ Starting headed recording…");
  console.log(`→ Compare URL: ${compareUrl}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 80,
  });

  const context = await browser.newContext({
    storageState: AUTH_FILE,
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: recordDir,
      size: { width: 1280, height: 800 },
    },
  });

  const page = await context.newPage();

  try {
    await page.goto(compareUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    // Title (GitHub compare / new PR form)
    const titleInput = page.locator("#pull_request_title").first();
    await titleInput.waitFor({ state: "visible", timeout: 30_000 });
    await titleInput.fill(PR_TITLE);

    // Description — GitHub uses a textarea or CodeMirror depending on UI
    const bodyTextarea = page.locator("#pull_request_body").first();
    if (await bodyTextarea.count()) {
      await bodyTextarea.fill(PR_BODY);
    } else {
      const cm = page.locator(".CodeMirror").first();
      if (await cm.count()) {
        await cm.click();
        await page.keyboard.press("Control+A");
        await page.keyboard.type(PR_BODY, { delay: 5 });
      }
    }

    // Create pull request
    const createBtn = page
      .locator('button:has-text("Create pull request"), button:has-text("Create Pull Request")')
      .first();
    await createBtn.waitFor({ state: "visible", timeout: 15_000 });
    await createBtn.click();

    // Wait until we land on the PR conversation page
    await page.waitForURL(/\/pull\/\d+/, { timeout: 60_000 });

    console.log("→ PR criado. Aguardando comentário do bot…");

    const comment = page
      .locator(".timeline-comment, .review-comment, [id^='issuecomment-']")
      .filter({ hasText: BOT_TEXT })
      .first();

    await comment.waitFor({ state: "visible", timeout: COMMENT_TIMEOUT_MS });

    await comment.scrollIntoViewIfNeeded();
    await page.evaluate((selectorText) => {
      const nodes = Array.from(
        document.querySelectorAll(
          ".timeline-comment, .review-comment, [id^='issuecomment-']",
        ),
      );
      const el = nodes.find((n) => n.textContent?.includes(selectorText));
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, BOT_TEXT);

    // Let the final frame "breathe" for the video
    await page.waitForTimeout(2800);

    console.log("✓ Comentário do bot visível — encerrando gravação.");
  } finally {
    await context.close();
    await browser.close();
  }

  // Move the recorded webm to the stable filename
  const recorded = readdirSync(recordDir).filter((f) => f.endsWith(".webm"));
  if (recorded.length === 0) {
    console.error("Nenhum vídeo .webm encontrado em", recordDir);
    process.exit(1);
  }

  const source = join(recordDir, recorded[0]!);
  if (existsSync(RAW_WEBM)) {
    renameSync(RAW_WEBM, resolve(VIDEO_DIR, `pr-assistant-demo-raw-${Date.now()}.webm`));
  }
  renameSync(source, RAW_WEBM);
  console.log(`✓ Vídeo bruto: ${RAW_WEBM}`);

  if (hasFfmpeg()) {
    console.log("→ Convertendo para GIF com ffmpeg…");
    convertToGif(RAW_WEBM);
  } else {
    console.log("\nffmpeg não encontrado — GIF não gerado.");
    console.log("Instale ffmpeg e rode manualmente:\n");
    console.log(
      `ffmpeg -y -i "${RAW_WEBM}" -vf "trim=start=${TRIM_START_SECONDS},setpts=PTS-STARTPTS,fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse" -loop 0 "${GIF_PATH}"`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
