import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfileFromMcpConfig } from "../aws-config.js";
import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as mcpConfigLocations from "../mcp-config-locations.js";

vi.mock("node:fs/promises");
vi.mock("node:fs");
vi.mock("../mcp-config-locations.js");

describe("getProfileFromMcpConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no config files exist", async () => {
    vi.mocked(mcpConfigLocations.getMcpConfigLocations).mockReturnValue([
      { path: "/test/.mcp.json", client: "Claude Code" },
    ]);
    vi.mocked(fsSync.existsSync).mockReturnValue(false);

    const result = await getProfileFromMcpConfig("bedrock-kb");

    expect(result).toBeNull();
  });

  it("returns profile lookup result when server is found", async () => {
    vi.mocked(mcpConfigLocations.getMcpConfigLocations).mockReturnValue([
      { path: "/test/.mcp.json", client: "Claude Code" },
    ]);
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

    const result = await getProfileFromMcpConfig("bedrock-kb");

    expect(result).toEqual({
      profile: "MCPServerReadAccess",
      configPath: "/test/.mcp.json",
      client: "Claude Code",
    });
  });

  it("returns null when server is not in config", async () => {
    vi.mocked(mcpConfigLocations.getMcpConfigLocations).mockReturnValue([
      { path: "/test/.mcp.json", client: "Claude Code" },
    ]);
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

    const result = await getProfileFromMcpConfig("bedrock-kb");

    expect(result).toBeNull();
  });

  it("returns null when server has no AWS_PROFILE", async () => {
    vi.mocked(mcpConfigLocations.getMcpConfigLocations).mockReturnValue([
      { path: "/test/.mcp.json", client: "Claude Code" },
    ]);
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

    const result = await getProfileFromMcpConfig("bedrock-kb");

    expect(result).toBeNull();
  });

  it("skips invalid JSON files and continues searching", async () => {
    vi.mocked(mcpConfigLocations.getMcpConfigLocations).mockReturnValue([
      { path: "/invalid/.mcp.json", client: "Claude Code" },
      { path: "/valid/.mcp.json", client: "Claude Desktop" },
    ]);
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

    const result = await getProfileFromMcpConfig("bedrock-kb");

    expect(result).toEqual({
      profile: "ValidProfile",
      configPath: "/valid/.mcp.json",
      client: "Claude Desktop",
    });
  });

  it("searches locations in order and returns first match", async () => {
    vi.mocked(mcpConfigLocations.getMcpConfigLocations).mockReturnValue([
      { path: "/first/.mcp.json", client: "Claude Code" },
      { path: "/second/.mcp.json", client: "Cursor" },
    ]);
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

    const result = await getProfileFromMcpConfig("bedrock-kb");

    expect(result).toEqual({
      profile: "FirstMatch",
      configPath: "/first/.mcp.json",
      client: "Claude Code",
    });
    expect(fs.readFile).toHaveBeenCalledTimes(1);
  });

  it("searches multiple MCP clients", async () => {
    vi.mocked(mcpConfigLocations.getMcpConfigLocations).mockReturnValue([
      { path: "/home/.mcp.json", client: "Claude Code" },
      { path: "/home/.cursor/mcp.json", client: "Cursor" },
      { path: "/home/Library/Application Support/Claude/claude_desktop_config.json", client: "Claude Desktop" },
    ]);
    vi.mocked(fsSync.existsSync)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          "bedrock-kb": {
            env: {
              AWS_PROFILE: "DesktopProfile",
            },
          },
        },
      })
    );

    const result = await getProfileFromMcpConfig("bedrock-kb");

    expect(result).toEqual({
      profile: "DesktopProfile",
      configPath: "/home/Library/Application Support/Claude/claude_desktop_config.json",
      client: "Claude Desktop",
    });
  });
});
