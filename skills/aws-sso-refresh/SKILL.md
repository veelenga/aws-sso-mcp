---
name: aws-sso-refresh
description: Automatically refresh AWS SSO authentication tokens when encountering expiration errors. Use when AWS MCP tools fail due to expired SSO sessions.
---

# AWS SSO Token Refresh

You are an expert at handling AWS SSO authentication token expiration and refresh.

## When to Use This Skill

Activate this skill when you encounter AWS SSO token expiration errors, such as:

- "Token has expired and refresh failed"
- "Error when retrieving token from sso"
- "The SSO session associated with this profile has expired"
- "ExpiredTokenException"
- Any AWS MCP tool failures mentioning authentication or token issues

## Critical: Find the Correct Profile First!

**Before refreshing, you MUST read `.mcp.json` to find the correct AWS profile for the failing MCP server.**

Different MCP servers may use different profiles. Using the wrong profile won't fix the issue.

```bash
# Read .mcp.json to find the profile
cat .mcp.json
```

Look for the `AWS_PROFILE` in the failing server's `env` section:

```json
{
  "mcpServers": {
    "bedrock-kb": {
      "env": {
        "AWS_PROFILE": "MCPServerReadAccess"
      }
    }
  }
}
```

## Workflow

When an AWS MCP operation fails due to expired tokens:

1. **Identify the failing MCP server**: Note which tool failed (e.g., `mcp__bedrock-kb__*` → server is `bedrock-kb`)

2. **Read `.mcp.json`**: Find the `AWS_PROFILE` for that server

3. **Run the refresh command** with the correct profile:
   ```bash
   aws sso login --profile <profile-from-mcp-json>
   ```

4. **Inform the user**: "Your AWS SSO session has expired. Please complete the authentication in your browser."

5. **Retry the operation**: Once refreshed, retry the original AWS operation

## Example

**Tool `mcp__bedrock-kb__ListKnowledgeBases` fails:**

```
Error: Token has expired and refresh failed
```

**Steps:**

1. The failing server is `bedrock-kb`
2. Read `.mcp.json`, find `bedrock-kb` has `AWS_PROFILE: "MCPServerReadAccess"`
3. Run: `aws sso login --profile MCPServerReadAccess`
4. Wait for browser authentication
5. Retry `ListKnowledgeBases`

## How to Refresh

```bash
aws sso login --profile <profile-name>
```

This opens a browser window for SSO authentication. Once completed, the token is cached locally.

## Proactive Behavior

- Automatically detect token expiration errors
- **Always read `.mcp.json` first** to find the correct profile
- If no profile found in config, ask the user which profile to use
- Keep the user informed about authentication status

## Important Notes

- SSO login opens a browser window - ensure user can access it
- Tokens typically expire after several hours
- Multiple MCP servers may share the same profile
- After refresh, all servers using that profile will work again
