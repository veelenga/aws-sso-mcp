import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { refreshSsoToken, type ProfileResolution } from "../aws-sso.js";
import * as childProcess from "node:child_process";
import { EventEmitter } from "node:events";

vi.mock("node:child_process");

function createMockProcess() {
  const mockProcess = new EventEmitter() as ReturnType<typeof childProcess.spawn>;

  Object.assign(mockProcess, {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn(),
  });

  return mockProcess;
}

describe("refreshSsoToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns success when login completes successfully", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "test-profile",
      source: "parameter",
    };

    const resultPromise = refreshSsoToken(resolution);
    mockProcess.emit("close", 0);

    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.profile).toBe("test-profile");
    expect(result.profileSource).toBe("parameter");
    expect(result.message).toContain("Successfully refreshed");
  });

  it("does not include CLI output in success message", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "test-profile",
      source: "parameter",
    };

    const resultPromise = refreshSsoToken(resolution);
    mockProcess.emit("close", 0);

    const result = await resultPromise;

    expect(result.message).toBe('Successfully refreshed SSO token for profile "test-profile".');
  });

  it("includes config details in result when provided", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "test-profile",
      source: "mcp_config",
      configPath: "/home/.mcp.json",
      mcpClient: "Claude Code",
    };

    const resultPromise = refreshSsoToken(resolution);
    mockProcess.emit("close", 0);

    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.profile).toBe("test-profile");
    expect(result.profileSource).toBe("mcp_config");
    expect(result.configPath).toBe("/home/.mcp.json");
    expect(result.mcpClient).toBe("Claude Code");
  });

  it("spawns aws sso login with correct arguments", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "my-profile",
      source: "mcp_config",
    };

    refreshSsoToken(resolution);

    expect(childProcess.spawn).toHaveBeenCalledWith(
      "aws",
      ["sso", "login", "--profile", "my-profile"],
      expect.objectContaining({
        stdio: ["ignore", "pipe", "pipe"],
      })
    );
  });

  it("returns generic failure message without CLI output", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "bad-profile",
      source: "environment",
    };

    const resultPromise = refreshSsoToken(resolution);
    mockProcess.emit("close", 1);

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.profile).toBe("bad-profile");
    expect(result.profileSource).toBe("environment");
    expect(result.message).toContain("failed");
    expect(result.message).toContain("check that the profile exists");
    expect(result.message).not.toContain("Error:");
  });

  it("returns failure on process error", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "test-profile",
      source: "fallback",
    };

    const resultPromise = refreshSsoToken(resolution);
    mockProcess.emit("error", new Error("spawn ENOENT"));

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.profileSource).toBe("fallback");
    expect(result.message).toContain("Failed to start AWS CLI");
  });

  it("returns failure and kills process on timeout", async () => {
    const mockProcess = createMockProcess();
    const killMock = mockProcess.kill as ReturnType<typeof vi.fn>;
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "slow-profile",
      source: "mcp_config",
      configPath: "/test/config.json",
      mcpClient: "Cursor",
    };

    const resultPromise = refreshSsoToken(resolution);

    vi.advanceTimersByTime(120_000);

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.profileSource).toBe("mcp_config");
    expect(result.configPath).toBe("/test/config.json");
    expect(result.mcpClient).toBe("Cursor");
    expect(result.message).toContain("timed out");
    expect(killMock).toHaveBeenCalled();
  });
});
