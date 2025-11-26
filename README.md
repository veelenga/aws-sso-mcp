# AWS SSO MCP

A Model Context Protocol (MCP) server for refreshing AWS SSO authentication tokens. Works with multiple MCP clients including Claude Desktop, Claude Code, Cursor, VS Code, Gemini CLI, and more.

## Supported MCP Clients

The server automatically detects AWS profile settings from the following MCP clients:

| Client | Config Location |
|--------|-----------------|
| Claude Code | `.mcp.json` (project), `~/.mcp.json` (user) |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) |
| Cursor | `.cursor/mcp.json` (project), `~/.cursor/mcp.json` (user) |
| VS Code | `.vscode/mcp.json` |
| Gemini CLI | `.gemini/settings.json` (project), `~/.gemini/settings.json` (user) |
| Copilot CLI | `~/.copilot/mcp-config.json` |
| Amazon Q | `~/.aws/amazonq/mcp.json` |
| Cline | VS Code extension settings |

## Installation

### Claude Code (Plugin)

```bash
/plugin marketplace add veelenga/aws-sso-mcp
/plugin install aws-sso-mcp@aws-sso-mcp
```

Restart Claude Code, then verify with `/mcp`.

### Claude Code (Manual) - WIP

```bash
npm install -g aws-sso-mcp
claude mcp add --scope user aws-sso aws-sso-mcp
```

### Claude Desktop

Add to your configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aws-sso": {
      "command": "npx",
      "args": ["-y", "aws-sso-mcp"],
      "env": {
        "AWS_PROFILE": "your-sso-profile"
      }
    }
  }
}
```

The `AWS_PROFILE` environment variable is used by the AWS CLI during SSO login. Configure it to match your SSO profile name.

### npx

```bash
npx aws-sso-mcp
```

## Tool

### refresh_aws_sso_token

Initiates the AWS SSO login flow to refresh expired authentication tokens. Opens a browser window for the user to complete authentication.

| Parameter | Type   | Required | Description                           |
| --------- | ------ | -------- | ------------------------------------- |
| profile   | string | No*      | AWS profile name to refresh token for. Takes precedence over `server` parameter. |
| server    | string | No*      | MCP server name to look up AWS_PROFILE from MCP config files (e.g., `bedrock-kb`). |

*At least one of `profile` or `server` must be provided.

**Profile resolution order:**

1. Explicit `profile` parameter
2. Look up from MCP config files by `server` name

**Example response:**

```json
{
  "success": true,
  "profile": "MCPServerReadAccess",
  "profileSource": "mcp_config",
  "message": "Successfully refreshed SSO token for profile \"MCPServerReadAccess\"."
}
```

## How It Works

1. When AWS operations fail due to expired SSO tokens, Claude detects the error
2. Claude calls `refresh_aws_sso_token` with the appropriate profile or server name
3. The server looks up the AWS profile from MCP config files (if `server` is provided)
4. A browser window opens for SSO authentication
5. Once authenticated, the original operation can be retried

## Bundled Skill

The plugin includes an `aws-sso-refresh` skill that provides:

- Automatic detection of token expiration errors
- Best practices for handling AWS SSO authentication
- Workflow guidance for retry operations

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Requirements

- Node.js 18+
- AWS CLI v2 installed and configured with SSO profiles
- An AWS SSO profile configured in `~/.aws/config`

## Security

The server implements several security measures:

- **Explicit profile selection**: Requires `profile` or `server` parameter to prevent unintended authentication actions
- **Trusted AWS CLI paths**: Only executes AWS CLI from system directories (`/usr/bin`, `/usr/local/bin`, `/opt/homebrew/bin`)
- **Symlink validation**: Resolves symlinks and verifies the real path is also in a trusted location
- **Minimal environment**: Spawns processes with a sanitized environment to prevent injection attacks (e.g., `LD_PRELOAD`)
- **No secrets in responses**: CLI output is not included in responses to prevent leaking device codes or URLs

## License

MIT
