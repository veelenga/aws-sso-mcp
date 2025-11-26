export const SERVER_NAME = "aws-sso-mcp";
export const SERVER_VERSION = "1.0.0";

export const TOOL_NAME = "refresh_aws_sso_token";

// Input validation constraints
export const MAX_PROFILE_LENGTH = 128;
export const MAX_SERVER_NAME_LENGTH = 128;
export const PROFILE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const PROFILE_NAME_PATTERN_ERROR =
  "Profile name can only contain letters, numbers, underscores, and hyphens";

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
  "/usr/local/aws-cli", // Official AWS CLI v2 installer location
  "/usr/bin",
  "/bin",
  // Homebrew paths (bin directories and Cellar for symlink resolution)
  "/opt/homebrew/bin", // macOS ARM Homebrew
  "/opt/homebrew/Cellar", // macOS ARM Homebrew packages
  "/usr/local/Cellar", // macOS Intel Homebrew packages
  "/home/linuxbrew/.linuxbrew/bin", // Linux Homebrew
  "/home/linuxbrew/.linuxbrew/Cellar", // Linux Homebrew packages
  // Windows standard paths
  "C:\\Program Files\\Amazon\\AWSCLIV2",
  "C:\\Program Files (x86)\\Amazon\\AWSCLIV2",
];
