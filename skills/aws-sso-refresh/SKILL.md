---
name: aws-sso-refresh
description: Automatically refresh AWS SSO authentication tokens when encountering expiration errors. Use when AWS MCP tools fail due to expired SSO sessions.
allowed-tools: mcp__aws-sso__refresh_aws_sso_token
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

## Tool Usage

### refresh_aws_sso_token

Use this tool to initiate the AWS SSO login flow:

- `profile`: AWS profile name (optional, defaults to "default")

**What happens:**

1. Opens a browser window for SSO authentication
2. User completes authentication in the browser
3. Token is refreshed and cached locally
4. Original operation can be retried

## Workflow

When an AWS operation fails due to expired tokens:

1. **Identify the error**: Look for token expiration messages in the error
2. **Determine the profile**: Check which AWS profile was being used (often in environment variables or MCP server config)
3. **Call refresh_aws_sso_token**: Use the appropriate profile name
4. **Wait for authentication**: Inform the user to complete browser authentication
5. **Retry the operation**: Once refreshed, retry the original AWS operation

## Example Interaction

**User runs a Bedrock KB query that fails:**

```
Error: Token has expired and refresh failed
```

**You should:**

1. Recognize this as an SSO expiration error
2. Call `refresh_aws_sso_token` with the appropriate profile
3. Inform the user: "Your AWS SSO session has expired. I'm initiating a refresh - please complete the authentication in your browser."
4. After success, retry the original query

## Common Profiles

When working with AWS MCP servers, check their configuration for the profile name:

- `MCPServerReadAccess` - Common profile for read-only MCP access
- `default` - Default AWS profile
- Custom profiles as configured in `~/.aws/config`

## Proactive Behavior

- Automatically detect token expiration errors without being asked
- Suggest refreshing when you see authentication failures
- Remember which profile was used for retry operations
- Keep the user informed about the authentication status

## Important Notes

- SSO login opens a browser window - ensure user can access it
- Tokens typically expire after several hours
- Multiple MCP servers may share the same profile
- After refresh, all servers using that profile will work again
