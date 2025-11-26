import { spawn } from "node:child_process";
import { SSO_LOGIN_TIMEOUT_MS } from "./constants.js";

export type ProfileSource = "parameter" | "mcp_config" | "environment" | "fallback";

export interface ProfileResolution {
  profile: string;
  source: ProfileSource;
}

export interface SsoRefreshResult {
  success: boolean;
  profile: string;
  profileSource: ProfileSource;
  message: string;
}

export async function refreshSsoToken(
  resolution: ProfileResolution
): Promise<SsoRefreshResult> {
  const { profile, source } = resolution;
  const baseResult = { profile, profileSource: source };

  return new Promise((resolve) => {
    const loginProcess = spawn("aws", ["sso", "login", "--profile", profile], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    const timeout = setTimeout(() => {
      loginProcess.kill();
      resolve({
        ...baseResult,
        success: false,
        message:
          `SSO login timed out after ${SSO_LOGIN_TIMEOUT_MS / 1000} seconds. ` +
          "Please complete the browser authentication.",
      });
    }, SSO_LOGIN_TIMEOUT_MS);

    loginProcess.on("close", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        resolve({
          ...baseResult,
          success: true,
          message: `Successfully refreshed SSO token for profile "${profile}".`,
        });
      } else {
        resolve({
          ...baseResult,
          success: false,
          message:
            `SSO login failed for profile "${profile}". ` +
            "Please check that the profile exists and is configured for SSO.",
        });
      }
    });

    loginProcess.on("error", (error) => {
      clearTimeout(timeout);
      resolve({
        ...baseResult,
        success: false,
        message: `Failed to start AWS CLI: ${error.message}`,
      });
    });
  });
}
