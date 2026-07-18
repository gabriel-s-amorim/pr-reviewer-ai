import { chromium, type Browser, type LaunchOptions } from "playwright";

/**
 * GitHub blocks Playwright's bundled Chromium ("browser may not be safe").
 * Prefer the real Chrome/Edge installed on the machine.
 */
export async function launchTrustedBrowser(
  options: Omit<LaunchOptions, "channel"> = {},
): Promise<Browser> {
  const preferred = (process.env.DEMO_BROWSER_CHANNEL ?? "chrome").toLowerCase();
  const channels = [preferred, "chrome", "msedge"].filter(
    (value, index, all) => all.indexOf(value) === index,
  );

  let lastError: unknown;

  for (const channel of channels) {
    try {
      return await chromium.launch({
        ...options,
        channel,
        headless: options.headless ?? false,
        ignoreDefaultArgs: ["--enable-automation"],
        args: [
          "--disable-blink-features=AutomationControlled",
          ...(options.args ?? []),
        ],
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Não foi possível abrir Chrome/Edge. Instale o Google Chrome ou defina DEMO_BROWSER_CHANNEL=msedge.\n` +
      `Último erro: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}
