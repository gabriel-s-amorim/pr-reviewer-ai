/**
 * One-time GitHub login → saves Playwright storageState for demo recording.
 *
 * Uses your real Chrome/Edge (not Playwright Chromium) so GitHub accepts login.
 * After you log in, the script detects the session and saves automatically
 * (no need to press Enter).
 *
 * Usage:
 *   pnpm auth:github
 */

import { mkdirSync } from "fs";
import { resolve } from "path";
import { launchTrustedBrowser } from "./playwright-browser";

const AUTH_DIR = resolve(process.cwd(), "playwright", ".auth");
const AUTH_FILE = resolve(AUTH_DIR, "github.json");
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

async function main() {
  mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await launchTrustedBrowser({ slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto("https://github.com/login", { waitUntil: "domcontentloaded" });

  console.log("\n→ Chrome/Edge aberto em github.com/login");
  console.log("→ Faça login (e 2FA, se pedir).");
  console.log("→ Quando o login concluir, a sessão será salva sozinha.\n");

  // Detect authenticated GitHub UI (home / feed / profile menu)
  await page.waitForFunction(
    () => {
      const href = window.location.href;
      if (href.includes("/login") || href.includes("/sessions")) return false;
      return Boolean(
        document.querySelector(
          "meta[name='user-login'], .AppHeader-user, img.avatar, [data-login]",
        ),
      );
    },
    { timeout: LOGIN_TIMEOUT_MS },
  );

  // Small settle time after redirect
  await page.waitForTimeout(1500);

  await context.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log(`\n✓ Sessão salva em ${AUTH_FILE}`);
  console.log("Agora você pode rodar: pnpm record:demo\n");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
