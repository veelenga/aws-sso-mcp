# MCP AWS SSO

A Model Context Protocol (MCP) server for refreshing AWS SSO authentication tokens. Works with Claude Desktop and Claude Code.

## Installation

### Claude Code (Plugin)

```bash
/plugin marketplace add veelenga/mcp-aws-sso
/plugin install mcp-aws-sso@mcp-aws-sso
```

Restart Claude Code, then verify with `/mcp`.

### Claude Code (Manual)

```bash
npm install -g mcp-aws-sso
claude mcp add --scope user aws-sso mcp-aws-sso
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
      "args": ["-y", "mcp-aws-sso"]
    }
  }
}
```

### npx

```bash
npx mcp-aws-sso
```

## Tool

### refresh_aws_sso_token

Initiates the AWS SSO login flow to refresh expired authentication tokens. Opens a browser window for the user to complete authentication.

| Parameter | Type   | Required | Default     | Description                           |
| --------- | ------ | -------- | ----------- | ------------------------------------- |
| profile   | string | No       | `"default"` | AWS profile name to refresh token for |

## How It Works

1. When AWS operations fail due to expired SSO tokens, Claude detects the error
2. Claude calls `refresh_aws_sso_token` with the appropriate profile
3. A browser window opens for SSO authentication
4. Once authenticated, the original operation can be retried

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

## License

MIT
