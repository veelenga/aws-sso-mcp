#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  AWS_PROFILE_ENV_VAR,
  FALLBACK_AWS_PROFILE,
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_DESCRIPTION,
  TOOL_NAME,
} from "./constants.js";
import { refreshSsoToken, type ProfileResolution } from "./aws-sso.js";
import { getProfileFromMcpConfig } from "./aws-config.js";

interface ResolveProfileOptions {
  profile?: string;
  server?: string;
}

async function resolveProfile(options: ResolveProfileOptions): Promise<ProfileResolution> {
  const { profile, server } = options;

  if (profile) {
    return { profile, source: "parameter" };
  }

  if (server) {
    const result = await getProfileFromMcpConfig(server);
    if (result) {
      return {
        profile: result.profile,
        source: "mcp_config",
      };
    }
  }

  const envProfile = process.env[AWS_PROFILE_ENV_VAR];
  if (envProfile) {
    return { profile: envProfile, source: "environment" };
  }

  return { profile: FALLBACK_AWS_PROFILE, source: "fallback" };
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
        .optional()
        .describe(
          "AWS profile name to refresh SSO token for. Takes precedence over 'server' parameter."
        ),
      server: z
        .string()
        .optional()
        .describe(
          "MCP server name to look up AWS_PROFILE from MCP config files. " +
            "Use this when an MCP tool fails due to expired SSO token (e.g., 'bedrock-kb')."
        ),
    },
    async ({ profile, server: serverName }) => {
      const resolution = await resolveProfile({ profile, server: serverName });
      const result = await refreshSsoToken(resolution);

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
