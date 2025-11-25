import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const MCP_CONFIG_FILENAME = ".mcp.json";

const DEFAULT_SEARCH_PATHS = [
  process.cwd(),
  join(process.cwd(), ".."),
  homedir(),
];

export async function getProfileFromMcpConfig(
  serverName: string,
  searchPaths: string[] = DEFAULT_SEARCH_PATHS
): Promise<string | null> {
  for (const basePath of searchPaths) {
    const configPath = join(basePath, MCP_CONFIG_FILENAME);

    if (!existsSync(configPath)) {
      continue;
    }

    try {
      const content = await readFile(configPath, "utf-8");
      const config = JSON.parse(content);
      const profile = config?.mcpServers?.[serverName]?.env?.AWS_PROFILE;

      if (profile) {
        return profile;
      }
    } catch {
      // Skip invalid config files
    }
  }

  return null;
}
