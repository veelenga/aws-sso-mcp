import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { getMcpConfigLocations, type McpConfigLocation } from "./mcp-config-locations.js";

export interface ProfileLookupResult {
  profile: string;
  configPath: string;
  client: string;
}

export async function getProfileFromMcpConfig(
  serverName: string
): Promise<ProfileLookupResult | null> {
  const locations = getMcpConfigLocations();

  for (const location of locations) {
    const result = await tryGetProfileFromConfig(serverName, location);
    if (result) {
      return result;
    }
  }

  return null;
}

async function tryGetProfileFromConfig(
  serverName: string,
  location: McpConfigLocation
): Promise<ProfileLookupResult | null> {
  if (!existsSync(location.path)) {
    return null;
  }

  try {
    const content = await readFile(location.path, "utf-8");
    const config = JSON.parse(content);
    const profile = config?.mcpServers?.[serverName]?.env?.AWS_PROFILE;

    if (profile) {
      return {
        profile,
        configPath: location.path,
        client: location.client,
      };
    }
  } catch {
    // Skip invalid config files
  }

  return null;
}
