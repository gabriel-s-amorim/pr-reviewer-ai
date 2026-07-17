import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import { getEnv } from "@/lib/env";

/**
 * GitHub App authentication flow:
 * 1. Sign a short-lived JWT (RS256) with the App private key (iss = App ID)
 * 2. Exchange that JWT for an installation access token
 * 3. Use the installation token for API calls on that installation's repos
 *
 * Never use a personal access token (PAT) for this product path.
 */
export function createInstallationOctokit(installationId: number): Octokit {
  const env = getEnv();

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.GITHUB_APP_ID,
      privateKey: env.githubAppPrivateKey,
      installationId,
    },
  });
}

/**
 * Low-level helper that documents the JWT → installation token exchange.
 * Prefer createInstallationOctokit() for normal API usage.
 */
export async function getInstallationAccessToken(
  installationId: number,
): Promise<string> {
  const env = getEnv();
  const auth = createAppAuth({
    appId: env.GITHUB_APP_ID,
    privateKey: env.githubAppPrivateKey,
  });

  const { token } = await auth({
    type: "installation",
    installationId,
  });

  return token;
}
