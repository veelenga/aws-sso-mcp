import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { refreshSsoToken, clearAwsCliPathCache, type ProfileResolution } from "../aws-sso.js";
import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import { EventEmitter } from "node:events";

vi.mock("node:child_process");
vi.mock("node:fs");

const MOCK_AWS_PATH = "/usr/local/bin/aws";

function createMockProcess() {
  const mockProcess = new EventEmitter() as ReturnType<typeof childProcess.spawn>;

  Object.assign(mockProcess, {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn(),
  });

  return mockProcess;
}

function setupAwsCliMock(path: string = MOCK_AWS_PATH) {
  vi.mocked(childProcess.execSync).mockReturnValue(path);
  vi.mocked(fs.existsSync).mockReturnValue(true);
  // Mock realpathSync to return the same path (no symlink)
  vi.mocked(fs.realpathSync).mockReturnValue(path);
}

describe("refreshSsoToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    clearAwsCliPathCache();
    setupAwsCliMock();
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

  it("returns correct source when profile from mcp_config", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "test-profile",
      source: "mcp_config",
    };

    const resultPromise = refreshSsoToken(resolution);
    mockProcess.emit("close", 0);

    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.profile).toBe("test-profile");
    expect(result.profileSource).toBe("mcp_config");
  });

  it("spawns aws from trusted path with correct arguments", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "my-profile",
      source: "mcp_config",
    };

    refreshSsoToken(resolution);

    expect(childProcess.spawn).toHaveBeenCalledWith(
      MOCK_AWS_PATH,
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
      source: "parameter",
    };

    const resultPromise = refreshSsoToken(resolution);
    mockProcess.emit("close", 1);

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.profile).toBe("bad-profile");
    expect(result.profileSource).toBe("parameter");
    expect(result.message).toContain("failed");
    expect(result.message).toContain("check that the profile exists");
    expect(result.message).not.toContain("Error:");
  });

  it("returns failure on process error", async () => {
    const mockProcess = createMockProcess();
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "test-profile",
      source: "mcp_config",
    };

    const resultPromise = refreshSsoToken(resolution);
    mockProcess.emit("error", new Error("spawn ENOENT"));

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.profileSource).toBe("mcp_config");
    expect(result.message).toContain("Failed to start AWS CLI");
  });

  it("returns failure and kills process on timeout", async () => {
    const mockProcess = createMockProcess();
    const killMock = mockProcess.kill as ReturnType<typeof vi.fn>;
    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resolution: ProfileResolution = {
      profile: "slow-profile",
      source: "mcp_config",
    };

    const resultPromise = refreshSsoToken(resolution);

    vi.advanceTimersByTime(120_000);

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.profileSource).toBe("mcp_config");
    expect(result.message).toContain("timed out");
    expect(killMock).toHaveBeenCalled();
  });

  describe("AWS CLI path resolution", () => {
    it("returns failure when AWS CLI is not found", async () => {
      clearAwsCliPathCache();
      vi.mocked(childProcess.execSync).mockImplementation(() => {
        throw new Error("not found");
      });

      const resolution: ProfileResolution = {
        profile: "test-profile",
        source: "parameter",
      };

      const result = await refreshSsoToken(resolution);

      expect(result.success).toBe(false);
      expect(result.message).toContain("AWS CLI not found in trusted location");
    });

    it("returns failure when AWS CLI path is not in trusted location", async () => {
      clearAwsCliPathCache();
      vi.mocked(childProcess.execSync).mockReturnValue("/tmp/malicious/aws");
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const resolution: ProfileResolution = {
        profile: "test-profile",
        source: "parameter",
      };

      const result = await refreshSsoToken(resolution);

      expect(result.success).toBe(false);
      expect(result.message).toContain("AWS CLI not found in trusted location");
    });

    it("accepts AWS CLI from /usr/bin", async () => {
      clearAwsCliPathCache();
      vi.mocked(childProcess.execSync).mockReturnValue("/usr/bin/aws");
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.realpathSync).mockReturnValue("/usr/bin/aws");

      const mockProcess = createMockProcess();
      vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

      const resolution: ProfileResolution = {
        profile: "test-profile",
        source: "parameter",
      };

      refreshSsoToken(resolution);

      expect(childProcess.spawn).toHaveBeenCalledWith(
        "/usr/bin/aws",
        expect.any(Array),
        expect.any(Object)
      );
    });

    it("accepts AWS CLI from homebrew path", async () => {
      clearAwsCliPathCache();
      vi.mocked(childProcess.execSync).mockReturnValue("/opt/homebrew/bin/aws");
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.realpathSync).mockReturnValue("/opt/homebrew/bin/aws");

      const mockProcess = createMockProcess();
      vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

      const resolution: ProfileResolution = {
        profile: "test-profile",
        source: "parameter",
      };

      refreshSsoToken(resolution);

      expect(childProcess.spawn).toHaveBeenCalledWith(
        "/opt/homebrew/bin/aws",
        expect.any(Array),
        expect.any(Object)
      );
    });

    it("caches the resolved AWS CLI path", async () => {
      clearAwsCliPathCache();
      const mockProcess = createMockProcess();
      vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

      const resolution: ProfileResolution = {
        profile: "test-profile",
        source: "parameter",
      };

      // First call
      const promise1 = refreshSsoToken(resolution);
      mockProcess.emit("close", 0);
      await promise1;

      // Second call
      const promise2 = refreshSsoToken(resolution);
      mockProcess.emit("close", 0);
      await promise2;

      // execSync should only be called once due to caching
      expect(childProcess.execSync).toHaveBeenCalledTimes(1);
    });

    it("rejects symlinks pointing to untrusted locations", async () => {
      clearAwsCliPathCache();
      vi.mocked(childProcess.execSync).mockReturnValue("/usr/local/bin/aws");
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // Symlink resolves to untrusted location
      vi.mocked(fs.realpathSync).mockReturnValue("/tmp/malicious/aws");

      const resolution: ProfileResolution = {
        profile: "test-profile",
        source: "parameter",
      };

      const result = await refreshSsoToken(resolution);

      expect(result.success).toBe(false);
      expect(result.message).toContain("AWS CLI not found in trusted location");
    });
  });
});
