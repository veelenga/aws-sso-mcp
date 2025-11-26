import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMcpConfigLocations } from "../mcp-config-locations.js";
import * as os from "node:os";

vi.mock("node:os");

describe("getMcpConfigLocations", () => {
  const originalCwd = process.cwd;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.cwd = vi.fn().mockReturnValue("/test/project");
    process.env = { ...originalEnv };
    vi.mocked(os.homedir).mockReturnValue("/home/user");
  });

  afterEach(() => {
    process.cwd = originalCwd;
    process.env = originalEnv;
  });

  it("returns Claude Code locations", () => {
    vi.mocked(os.platform).mockReturnValue("darwin");

    const locations = getMcpConfigLocations();

    const claudeCodeLocations = locations.filter((l) => l.client === "Claude Code");
    expect(claudeCodeLocations).toContainEqual({
      path: "/test/project/.mcp.json",
      client: "Claude Code",
    });
    expect(claudeCodeLocations).toContainEqual({
      path: "/test/.mcp.json",
      client: "Claude Code",
    });
    expect(claudeCodeLocations).toContainEqual({
      path: "/home/user/.mcp.json",
      client: "Claude Code",
    });
  });

  it("returns Cursor locations", () => {
    vi.mocked(os.platform).mockReturnValue("darwin");

    const locations = getMcpConfigLocations();

    const cursorLocations = locations.filter((l) => l.client === "Cursor");
    expect(cursorLocations).toContainEqual({
      path: "/test/project/.cursor/mcp.json",
      client: "Cursor",
    });
    expect(cursorLocations).toContainEqual({
      path: "/home/user/.cursor/mcp.json",
      client: "Cursor",
    });
  });

  it("returns VS Code locations", () => {
    vi.mocked(os.platform).mockReturnValue("darwin");

    const locations = getMcpConfigLocations();

    expect(locations).toContainEqual({
      path: "/test/project/.vscode/mcp.json",
      client: "VS Code",
    });
  });

  it("returns Gemini CLI locations", () => {
    vi.mocked(os.platform).mockReturnValue("darwin");

    const locations = getMcpConfigLocations();

    const geminiLocations = locations.filter((l) => l.client === "Gemini CLI");
    expect(geminiLocations).toContainEqual({
      path: "/test/project/.gemini/settings.json",
      client: "Gemini CLI",
    });
    expect(geminiLocations).toContainEqual({
      path: "/home/user/.gemini/settings.json",
      client: "Gemini CLI",
    });
  });

  it("returns Copilot CLI locations", () => {
    vi.mocked(os.platform).mockReturnValue("darwin");

    const locations = getMcpConfigLocations();

    expect(locations).toContainEqual({
      path: "/home/user/.copilot/mcp-config.json",
      client: "Copilot CLI",
    });
  });

  it("returns Amazon Q locations", () => {
    vi.mocked(os.platform).mockReturnValue("darwin");

    const locations = getMcpConfigLocations();

    expect(locations).toContainEqual({
      path: "/home/user/.aws/amazonq/mcp.json",
      client: "Amazon Q",
    });
  });

  describe("platform-specific locations", () => {
    it("returns macOS Claude Desktop path on darwin", () => {
      vi.mocked(os.platform).mockReturnValue("darwin");

      const locations = getMcpConfigLocations();

      expect(locations).toContainEqual({
        path: "/home/user/Library/Application Support/Claude/claude_desktop_config.json",
        client: "Claude Desktop",
      });
    });

    it("returns macOS Cline path on darwin", () => {
      vi.mocked(os.platform).mockReturnValue("darwin");

      const locations = getMcpConfigLocations();

      expect(locations).toContainEqual({
        path: "/home/user/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
        client: "Cline",
      });
    });

    it("returns Windows Claude Desktop path on win32", () => {
      vi.mocked(os.platform).mockReturnValue("win32");
      process.env.APPDATA = "C:\\Users\\user\\AppData\\Roaming";

      const locations = getMcpConfigLocations();

      expect(locations).toContainEqual({
        path: "C:\\Users\\user\\AppData\\Roaming/Claude/claude_desktop_config.json",
        client: "Claude Desktop",
      });
    });

    it("returns Linux Claude Desktop path on linux", () => {
      vi.mocked(os.platform).mockReturnValue("linux");

      const locations = getMcpConfigLocations();

      expect(locations).toContainEqual({
        path: "/home/user/.config/Claude/claude_desktop_config.json",
        client: "Claude Desktop",
      });
    });

    it("uses XDG_CONFIG_HOME on Linux when set", () => {
      vi.mocked(os.platform).mockReturnValue("linux");
      process.env.XDG_CONFIG_HOME = "/custom/config";

      const locations = getMcpConfigLocations();

      expect(locations).toContainEqual({
        path: "/custom/config/Claude/claude_desktop_config.json",
        client: "Claude Desktop",
      });
    });
  });

  it("includes all expected clients", () => {
    vi.mocked(os.platform).mockReturnValue("darwin");

    const locations = getMcpConfigLocations();
    const clients = [...new Set(locations.map((l) => l.client))];

    expect(clients).toContain("Claude Code");
    expect(clients).toContain("Claude Desktop");
    expect(clients).toContain("Cursor");
    expect(clients).toContain("VS Code");
    expect(clients).toContain("Gemini CLI");
    expect(clients).toContain("Copilot CLI");
    expect(clients).toContain("Amazon Q");
    expect(clients).toContain("Cline");
  });
});
