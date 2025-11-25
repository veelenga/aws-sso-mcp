# AWS SSO MCP

A Model Context Protocol (MCP) server for refreshing AWS SSO authentication tokens. Works with Claude Desktop and Claude Code.

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

The `AWS_PROFILE` environment variable sets the default profile for the refresh tool. If not specified, defaults to `"default"`.

### npx

```bash
npx aws-sso-mcp
```

## Tool

### refresh_aws_sso_token

Initiates the AWS SSO login flow to refresh expired authentication tokens. Opens a browser window for the user to complete authentication.

| Parameter | Type   | Required | Default | Description                           |
| --------- | ------ | -------- | ------- | ------------------------------------- |
| profile   | string | No       | auto    | AWS profile name to refresh token for |

**Profile resolution order:**
1. Explicit `profile` parameter
2. `$AWS_PROFILE` environment variable
3. Most recently used SSO profile (inferred from `~/.aws/sso/cache/`)
4. Fallback to `"default"`

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
