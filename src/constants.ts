export const SERVER_NAME = "mcp-aws-sso";
export const SERVER_VERSION = "1.0.0";

export const DEFAULT_AWS_PROFILE = "default";

export const TOOL_NAME = "refresh_aws_sso_token";

export const TOOL_DESCRIPTION =
  "Initiates AWS SSO login flow to refresh expired authentication tokens. " +
  "This will open a browser window for the user to complete authentication. " +
  "Use this when AWS operations fail due to expired SSO tokens.";

export const SSO_LOGIN_TIMEOUT_MS = 120_000;
