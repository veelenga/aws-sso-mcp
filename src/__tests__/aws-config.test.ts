import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfileFromMcpConfig } from "../aws-config.js";
import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";

vi.mock("node:fs/promises");
vi.mock("node:fs");

describe("getProfileFromMcpConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no config files exist", async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(false);

    const profile = await getProfileFromMcpConfig("bedrock-kb", ["/test"]);

    expect(profile).toBeNull();
  });

  it("returns profile from mcp config when server is found", async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          "bedrock-kb": {
            env: {
              AWS_PROFILE: "MCPServerReadAccess",
            },
          },
        },
      })
    );

    const profile = await getProfileFromMcpConfig("bedrock-kb", ["/test"]);

    expect(profile).toBe("MCPServerReadAccess");
  });

  it("returns null when server is not in config", async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          "other-server": {
            env: {
              AWS_PROFILE: "OtherProfile",
            },
          },
        },
      })
    );

    const profile = await getProfileFromMcpConfig("bedrock-kb", ["/test"]);

    expect(profile).toBeNull();
  });

  it("returns null when server has no AWS_PROFILE", async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          "bedrock-kb": {
            env: {},
          },
        },
      })
    );

    const profile = await getProfileFromMcpConfig("bedrock-kb", ["/test"]);

    expect(profile).toBeNull();
  });

  it("skips invalid JSON files and continues searching", async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile)
      .mockRejectedValueOnce(new Error("Invalid JSON"))
      .mockResolvedValueOnce(
        JSON.stringify({
          mcpServers: {
            "bedrock-kb": {
              env: {
                AWS_PROFILE: "ValidProfile",
              },
            },
          },
        })
      );

    const profile = await getProfileFromMcpConfig("bedrock-kb", [
      "/invalid",
      "/valid",
    ]);

    expect(profile).toBe("ValidProfile");
  });

  it("searches paths in order and returns first match", async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          "bedrock-kb": {
            env: {
              AWS_PROFILE: "FirstMatch",
            },
          },
        },
      })
    );

    const profile = await getProfileFromMcpConfig("bedrock-kb", [
      "/first",
      "/second",
    ]);

    expect(profile).toBe("FirstMatch");
    expect(fs.readFile).toHaveBeenCalledTimes(1);
  });
});
