/**
 * One-time GitHub login → saves Playwright storageState for demo recording.
 *
 * Usage:
 *   pnpm auth:github
 *
 * A headed browser opens. Log in to GitHub manually (including 2FA if needed).
 * When you see your authenticated GitHub home, press Enter in this terminal.
 * Session is saved to playwright/.auth/github.json (gitignored).
 */

import { mkdirSync } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";
import { chromium } from "playwright";

const AUTH_DIR = resolve(process.cwd(), "playwright", ".auth");
const AUTH_FILE = resolve(AUTH_DIR, "github.json");

async function waitForEnter(prompt: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolvePromise) => {
    rl.question(prompt, () => {
      rl.close();
      resolvePromise();
    });
  });
}

async function main() {
  mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto("https://github.com/login", { waitUntil: "domcontentloaded" });

  console.log("\n→ Browser aberto em github.com/login");
  console.log("→ Faça login (e 2FA, se pedir).");
  console.log("→ Quando estiver logado e vir a home do GitHub, volte aqui.\n");

  await waitForEnter("Pressione Enter neste terminal para salvar a sessão… ");

  await context.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log(`\n✓ Sessão salva em ${AUTH_FILE}`);
  console.log("Agora você pode rodar: pnpm record:demo\n");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
