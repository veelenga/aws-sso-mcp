import { spawn, execSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { SSO_LOGIN_TIMEOUT_MS, TRUSTED_PATH_PREFIXES } from "./constants.js";

// Minimal environment for spawned processes to prevent env injection attacks
// (e.g., LD_PRELOAD, DYLD_INSERT_LIBRARIES)
function getMinimalEnv(sanitizedPath: string): NodeJS.ProcessEnv {
  const isWindows = process.platform === "win32";
  const env: NodeJS.ProcessEnv = {
    PATH: sanitizedPath,
    HOME: process.env.HOME,
    USER: process.env.USER,
    SHELL: process.env.SHELL,
  };

  if (isWindows) {
    env.SYSTEMROOT = process.env.SYSTEMROOT;
    env.COMSPEC = process.env.COMSPEC;
    env.USERPROFILE = process.env.USERPROFILE;
  }

  return env;
}

export type ProfileSource = "parameter" | "mcp_config";

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
let cachedSanitizedPath: string | null = null;

function isTrustedPath(path: string): boolean {
  const normalizedPath = path.toLowerCase();
  return TRUSTED_PATH_PREFIXES.some((prefix) =>
    normalizedPath.startsWith(prefix.toLowerCase())
  );
}

function resolveAwsCliPath(): string | null {
  if (cachedAwsCliPath) {
    return cachedAwsCliPath;
  }

  try {
    const isWindows = process.platform === "win32";
    const command = isWindows ? "where aws" : "which aws";

    // Use a sanitized PATH with only trusted directories
    const sanitizedPath = TRUSTED_PATH_PREFIXES.join(isWindows ? ";" : ":");
    cachedSanitizedPath = sanitizedPath;

    const result = execSync(command, {
      encoding: "utf-8",
      env: getMinimalEnv(sanitizedPath),
      timeout: 5000,
    }).trim();

    // On Windows, 'where' may return multiple lines; take the first
    const awsPath = result.split(/\r?\n/)[0];

    if (!awsPath || !existsSync(awsPath)) {
      return null;
    }

    // Validate the initial path is under a trusted prefix
    if (!isTrustedPath(awsPath)) {
      return null;
    }

    // Resolve symlinks to get the real path and verify it's also trusted
    // This prevents symlink attacks like /usr/local/bin/aws -> /tmp/malicious
    let realPath: string;
    try {
      realPath = realpathSync(awsPath);
    } catch {
      // If we can't resolve the real path, reject it
      return null;
    }

    // The real path must also be in a trusted location
    if (!isTrustedPath(realPath)) {
      return null;
    }

    cachedAwsCliPath = realPath;
    return realPath;
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
    // Use minimal environment to prevent env injection attacks
    const sanitizedPath = cachedSanitizedPath ?? TRUSTED_PATH_PREFIXES.join(
      process.platform === "win32" ? ";" : ":"
    );

    const loginProcess = spawn(awsCliPath, ["sso", "login", "--profile", profile], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
      env: getMinimalEnv(sanitizedPath),
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
  cachedSanitizedPath = null;
}
