import { homedir, platform } from "node:os";
import { join } from "node:path";

export interface McpConfigLocation {
  path: string;
  client: string;
}

function getAppDataPath(): string {
  return process.env.APPDATA || join(homedir(), "AppData", "Roaming");
}

function getXdgConfigHome(): string {
  return process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
}

export function getMcpConfigLocations(): McpConfigLocation[] {
  const home = homedir();
  const cwd = process.cwd();
  const os = platform();

  const locations: McpConfigLocation[] = [
    // Claude Code - project and user configs
    { path: join(cwd, ".mcp.json"), client: "Claude Code" },
    { path: join(cwd, "..", ".mcp.json"), client: "Claude Code" },
    { path: join(home, ".mcp.json"), client: "Claude Code" },

    // Cursor - project and user configs
    { path: join(cwd, ".cursor", "mcp.json"), client: "Cursor" },
    { path: join(home, ".cursor", "mcp.json"), client: "Cursor" },

    // VS Code - project config
    { path: join(cwd, ".vscode", "mcp.json"), client: "VS Code" },

    // Gemini CLI - project and user configs
    { path: join(cwd, ".gemini", "settings.json"), client: "Gemini CLI" },
    { path: join(home, ".gemini", "settings.json"), client: "Gemini CLI" },

    // GitHub Copilot CLI
    { path: join(home, ".copilot", "mcp-config.json"), client: "Copilot CLI" },

    // Amazon Q Developer
    { path: join(home, ".aws", "amazonq", "mcp.json"), client: "Amazon Q" },
  ];

  // Platform-specific locations
  if (os === "darwin") {
    // macOS
    locations.push(
      {
        path: join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
        client: "Claude Desktop",
      },
      {
        path: join(
          home,
          "Library",
          "Application Support",
          "Code",
          "User",
          "globalStorage",
          "saoudrizwan.claude-dev",
          "settings",
          "cline_mcp_settings.json"
        ),
        client: "Cline",
      }
    );
  } else if (os === "win32") {
    // Windows
    const appData = getAppDataPath();
    locations.push(
      {
        path: join(appData, "Claude", "claude_desktop_config.json"),
        client: "Claude Desktop",
      },
      {
        path: join(
          appData,
          "Code",
          "User",
          "globalStorage",
          "saoudrizwan.claude-dev",
          "settings",
          "cline_mcp_settings.json"
        ),
        client: "Cline",
      }
    );
  } else {
    // Linux
    const xdgConfig = getXdgConfigHome();
    locations.push(
      {
        path: join(xdgConfig, "Claude", "claude_desktop_config.json"),
        client: "Claude Desktop",
      },
      {
        path: join(
          xdgConfig,
          "Code",
          "User",
          "globalStorage",
          "saoudrizwan.claude-dev",
          "settings",
          "cline_mcp_settings.json"
        ),
        client: "Cline",
      }
    );
  }

  return locations;
}
