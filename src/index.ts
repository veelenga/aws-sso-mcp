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
import { refreshSsoToken } from "./aws-sso.js";

function getDefaultProfile(): string {
  return process.env[AWS_PROFILE_ENV_VAR] || FALLBACK_AWS_PROFILE;
}

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  const defaultProfile = getDefaultProfile();

  server.tool(
    TOOL_NAME,
    TOOL_DESCRIPTION,
    {
      profile: z
        .string()
        .optional()
        .default(defaultProfile)
        .describe(`AWS profile name to refresh SSO token for (default: "${defaultProfile}")`),
    },
    async ({ profile }) => {
      const result = await refreshSsoToken(profile);

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
