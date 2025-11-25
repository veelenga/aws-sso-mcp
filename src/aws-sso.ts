import { spawn } from "node:child_process";
import { SSO_LOGIN_TIMEOUT_MS } from "./constants.js";

export interface SsoRefreshResult {
  success: boolean;
  profile: string;
  message: string;
}

export async function refreshSsoToken(profile: string): Promise<SsoRefreshResult> {
  return new Promise((resolve) => {
    const loginProcess = spawn("aws", ["sso", "login", "--profile", profile], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    let stdout = "";
    let stderr = "";

    loginProcess.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    loginProcess.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      loginProcess.kill();
      resolve({
        success: false,
        profile,
        message:
          `SSO login timed out after ${SSO_LOGIN_TIMEOUT_MS / 1000} seconds. ` +
          "Please complete the browser authentication.",
      });
    }, SSO_LOGIN_TIMEOUT_MS);

    loginProcess.on("close", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        resolve({
          success: true,
          profile,
          message: `Successfully refreshed SSO token for profile "${profile}". ${stdout}`.trim(),
        });
      } else {
        resolve({
          success: false,
          profile,
          message: `SSO login failed for profile "${profile}": ${stderr || stdout}`.trim(),
        });
      }
    });

    loginProcess.on("error", (error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        profile,
        message: `Failed to start SSO login: ${error.message}`,
      });
    });
  });
}
