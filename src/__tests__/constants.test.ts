import { describe, it, expect } from "vitest";
import {
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_NAME,
  TOOL_DESCRIPTION,
  SSO_LOGIN_TIMEOUT_MS,
  TRUSTED_PATH_PREFIXES,
  MAX_PROFILE_LENGTH,
  MAX_SERVER_NAME_LENGTH,
  PROFILE_NAME_PATTERN,
  PROFILE_NAME_PATTERN_ERROR,
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

  it("has input validation constants", () => {
    expect(MAX_PROFILE_LENGTH).toBe(128);
    expect(MAX_SERVER_NAME_LENGTH).toBe(128);
    expect(PROFILE_NAME_PATTERN).toBeInstanceOf(RegExp);
    expect(PROFILE_NAME_PATTERN_ERROR).toBeTruthy();
  });

  it("validates profile names correctly", () => {
    expect(PROFILE_NAME_PATTERN.test("valid-profile")).toBe(true);
    expect(PROFILE_NAME_PATTERN.test("valid_profile")).toBe(true);
    expect(PROFILE_NAME_PATTERN.test("ValidProfile123")).toBe(true);
    expect(PROFILE_NAME_PATTERN.test("invalid profile")).toBe(false);
    expect(PROFILE_NAME_PATTERN.test("invalid;profile")).toBe(false);
    expect(PROFILE_NAME_PATTERN.test("")).toBe(false);
  });
});
