import { spawn, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { SSO_LOGIN_TIMEOUT_MS, TRUSTED_PATH_PREFIXES } from "./constants.js";

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

let cachedAwsCliPath: string | null = null;

function resolveAwsCliPath(): string | null {
  if (cachedAwsCliPath) {
    return cachedAwsCliPath;
  }

  try {
    const isWindows = process.platform === "win32";
    const command = isWindows ? "where aws" : "which aws";

    // Use a sanitized PATH with only trusted directories
    const sanitizedPath = TRUSTED_PATH_PREFIXES.join(isWindows ? ";" : ":");

    const result = execSync(command, {
      encoding: "utf-8",
      env: { ...process.env, PATH: sanitizedPath },
      timeout: 5000,
    }).trim();

    // On Windows, 'where' may return multiple lines; take the first
    const awsPath = result.split(/\r?\n/)[0];

    if (!awsPath || !existsSync(awsPath)) {
      return null;
    }

    // Validate the resolved path is under a trusted prefix
    const normalizedPath = awsPath.toLowerCase();
    const isTrusted = TRUSTED_PATH_PREFIXES.some((prefix) =>
      normalizedPath.startsWith(prefix.toLowerCase())
    );

    if (!isTrusted) {
      return null;
    }

    cachedAwsCliPath = awsPath;
    return awsPath;
  } catch {
    return null;
  }
}

export async function refreshSsoToken(
  resolution: ProfileResolution
): Promise<SsoRefreshResult> {
  const { profile, source } = resolution;
  const baseResult = { profile, profileSource: source };

  const awsCliPath = resolveAwsCliPath();
  if (!awsCliPath) {
    return {
      ...baseResult,
      success: false,
      message:
        "AWS CLI not found in trusted location. " +
        "Please ensure AWS CLI v2 is installed in a standard system path.",
    };
  }

  return new Promise((resolve) => {
    const loginProcess = spawn(awsCliPath, ["sso", "login", "--profile", profile], {
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

// Exported for testing
export function clearAwsCliPathCache(): void {
  cachedAwsCliPath = null;
}
