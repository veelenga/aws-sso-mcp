export const SERVER_NAME = "aws-sso-mcp";
export const SERVER_VERSION = "1.0.0";

export const TOOL_NAME = "refresh_aws_sso_token";

export const TOOL_DESCRIPTION =
  "Initiates AWS SSO login flow to refresh expired authentication tokens. " +
  "This will open a browser window for the user to complete authentication. " +
  "Use this when AWS operations fail due to expired SSO tokens.";

export const SSO_LOGIN_TIMEOUT_MS = 120_000;

// Trusted directories where AWS CLI may be installed
// Used to prevent PATH injection attacks
export const TRUSTED_PATH_PREFIXES = [
  // macOS / Linux standard paths
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/opt/homebrew/bin", // macOS ARM Homebrew
  "/home/linuxbrew/.linuxbrew/bin", // Linux Homebrew
  // Windows standard paths
  "C:\\Program Files\\Amazon\\AWSCLIV2",
  "C:\\Program Files (x86)\\Amazon\\AWSCLIV2",
];
