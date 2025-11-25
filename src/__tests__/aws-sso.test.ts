import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { refreshSsoToken } from "../aws-sso.js";
import * as childProcess from "node:child_process";
import { EventEmitter } from "node:events";

vi.mock("node:child_process");

describe("refreshSsoToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns success when login completes successfully", async () => {
    const mockProcess = new EventEmitter() as ReturnType<typeof childProcess.spawn>;
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();

    Object.assign(mockProcess, {
      stdout: mockStdout,
      stderr: mockStderr,
      kill: vi.fn(),
    });

    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resultPromise = refreshSsoToken("test-profile");

    mockStdout.emit("data", Buffer.from("Successfully logged in"));
    mockProcess.emit("close", 0);

    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.profile).toBe("test-profile");
    expect(result.message).toContain("Successfully refreshed");
  });

  it("spawns aws sso login with correct arguments", async () => {
    const mockProcess = new EventEmitter() as ReturnType<typeof childProcess.spawn>;
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();

    Object.assign(mockProcess, {
      stdout: mockStdout,
      stderr: mockStderr,
      kill: vi.fn(),
    });

    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    refreshSsoToken("my-profile");

    expect(childProcess.spawn).toHaveBeenCalledWith(
      "aws",
      ["sso", "login", "--profile", "my-profile"],
      expect.objectContaining({
        stdio: ["ignore", "pipe", "pipe"],
      })
    );
  });

  it("returns failure when login fails with non-zero exit code", async () => {
    const mockProcess = new EventEmitter() as ReturnType<typeof childProcess.spawn>;
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();

    Object.assign(mockProcess, {
      stdout: mockStdout,
      stderr: mockStderr,
      kill: vi.fn(),
    });

    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resultPromise = refreshSsoToken("bad-profile");

    mockStderr.emit("data", Buffer.from("Profile not found"));
    mockProcess.emit("close", 1);

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.profile).toBe("bad-profile");
    expect(result.message).toContain("failed");
    expect(result.message).toContain("Profile not found");
  });

  it("returns failure on process error", async () => {
    const mockProcess = new EventEmitter() as ReturnType<typeof childProcess.spawn>;
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();

    Object.assign(mockProcess, {
      stdout: mockStdout,
      stderr: mockStderr,
      kill: vi.fn(),
    });

    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resultPromise = refreshSsoToken("test-profile");

    mockProcess.emit("error", new Error("Command not found"));

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.message).toContain("Failed to start SSO login");
    expect(result.message).toContain("Command not found");
  });

  it("returns failure and kills process on timeout", async () => {
    const mockProcess = new EventEmitter() as ReturnType<typeof childProcess.spawn>;
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();
    const killMock = vi.fn();

    Object.assign(mockProcess, {
      stdout: mockStdout,
      stderr: mockStderr,
      kill: killMock,
    });

    vi.mocked(childProcess.spawn).mockReturnValue(mockProcess);

    const resultPromise = refreshSsoToken("slow-profile");

    vi.advanceTimersByTime(120_000);

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.message).toContain("timed out");
    expect(killMock).toHaveBeenCalled();
  });
});
