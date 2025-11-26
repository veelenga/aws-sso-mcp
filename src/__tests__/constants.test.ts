import { describe, it, expect } from "vitest";
import {
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_NAME,
  TOOL_DESCRIPTION,
  SSO_LOGIN_TIMEOUT_MS,
  TRUSTED_PATH_PREFIXES,
} from "../constants.js";

describe("constants", () => {
  it("has correct server metadata", () => {
    expect(SERVER_NAME).toBe("aws-sso-mcp");
    expect(SERVER_VERSION).toBe("1.0.0");
  });

  it("has tool name defined", () => {
    expect(TOOL_NAME).toBe("refresh_aws_sso_token");
  });

  it("has tool description defined", () => {
    expect(TOOL_DESCRIPTION).toBeTruthy();
    expect(TOOL_DESCRIPTION.length).toBeGreaterThan(10);
    expect(TOOL_DESCRIPTION).toContain("SSO");
  });

  it("has reasonable timeout value", () => {
    expect(SSO_LOGIN_TIMEOUT_MS).toBe(120_000);
    expect(SSO_LOGIN_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
  });

  it("has trusted path prefixes for AWS CLI", () => {
    expect(TRUSTED_PATH_PREFIXES).toBeInstanceOf(Array);
    expect(TRUSTED_PATH_PREFIXES.length).toBeGreaterThan(0);
    expect(TRUSTED_PATH_PREFIXES).toContain("/usr/local/bin");
    expect(TRUSTED_PATH_PREFIXES).toContain("/usr/bin");
  });
});
