#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_DESCRIPTION,
  TOOL_NAME,
  MAX_PROFILE_LENGTH,
  MAX_SERVER_NAME_LENGTH,
  PROFILE_NAME_PATTERN,
  PROFILE_NAME_PATTERN_ERROR,
} from "./constants.js";
import { refreshSsoToken, type ProfileResolution } from "./aws-sso.js";
import { getProfileFromMcpConfig } from "./aws-config.js";

interface ResolveProfileOptions {
  profile?: string;
  server?: string;
}

type ResolveProfileResult =
  | { success: true; resolution: ProfileResolution }
  | { success: false; error: string };

async function resolveProfile(options: ResolveProfileOptions): Promise<ResolveProfileResult> {
  const { profile, server } = options;

  if (profile) {
    return { success: true, resolution: { profile, source: "parameter" } };
  }

  if (server) {
    const result = await getProfileFromMcpConfig(server);
    if (result) {
      return {
        success: true,
        resolution: {
          profile: result.profile,
          source: "mcp_config",
        },
      };
    }
    return {
      success: false,
      error:
        `Could not find AWS_PROFILE for MCP server "${server}" in any config file. ` +
        "Please specify the 'profile' parameter directly.",
    };
  }

  return {
    success: false,
    error:
      "No profile specified. Please provide either 'profile' (AWS profile name) " +
      "or 'server' (MCP server name to look up profile from config).",
  };
}

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.tool(
    TOOL_NAME,
    TOOL_DESCRIPTION,
    {
      profile: z
        .string()
        .max(MAX_PROFILE_LENGTH, `Profile name too long (max ${MAX_PROFILE_LENGTH} characters)`)
        .regex(PROFILE_NAME_PATTERN, PROFILE_NAME_PATTERN_ERROR)
        .optional()
        .describe(
          "AWS profile name to refresh SSO token for. Takes precedence over 'server' parameter."
        ),
      server: z
        .string()
        .max(MAX_SERVER_NAME_LENGTH, `Server name too long (max ${MAX_SERVER_NAME_LENGTH} characters)`)
        .optional()
        .describe(
          "MCP server name to look up AWS_PROFILE from MCP config files. " +
            "Use this when an MCP tool fails due to expired SSO token (e.g., 'bedrock-kb')."
        ),
    },
    async ({ profile, server: serverName }) => {
      const resolveResult = await resolveProfile({ profile, server: serverName });

      if (!resolveResult.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { success: false, message: resolveResult.error },
                null,
                2
              ),
            },
          ],
        };
      }

      const result = await refreshSsoToken(resolveResult.resolution);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
