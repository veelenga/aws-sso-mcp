# MCP AWS SSO

[![CI](https://github.com/veelenga/mcp-aws-sso/actions/workflows/ci.yml/badge.svg)](https://github.com/veelenga/mcp-aws-sso/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/mcp-aws-sso.svg)](https://www.npmjs.com/package/mcp-aws-sso)

A Model Context Protocol (MCP) server for refreshing AWS SSO authentication tokens. Works with Claude Desktop and other MCP-compatible clients.

## Installation

```bash
npm install -g mcp-aws-sso
```

Or use directly with npx:

```bash
npx mcp-aws-sso
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aws-sso": {
      "command": "npx",
      "args": ["mcp-aws-sso"]
    }
  }
}
```

### Claude Code CLI

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "aws-sso": {
      "command": "npx",
      "args": ["mcp-aws-sso"]
    }
  }
}
```

## Tool

### refresh_aws_sso_token

Initiates the AWS SSO login flow to refresh expired authentication tokens. Opens a browser window for the user to complete authentication.

| Parameter | Type   | Required | Default     | Description                            |
| --------- | ------ | -------- | ----------- | -------------------------------------- |
| profile   | string | No       | `"default"` | AWS profile name to refresh token for  |

## How It Works

1. When AWS operations fail due to expired SSO tokens, Claude detects the error
2. Claude calls `refresh_aws_sso_token` with the appropriate profile
3. A browser window opens for SSO authentication
4. Once authenticated, the original operation can be retried

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
