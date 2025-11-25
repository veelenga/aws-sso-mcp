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

## How to Refresh

Run the AWS CLI command to initiate SSO login:

```bash
aws sso login --profile <profile-name>
```

**What happens:**

1. Opens a browser window for SSO authentication
2. User completes authentication in the browser
3. Token is refreshed and cached locally
4. Original operation can be retried

## Workflow

When an AWS operation fails due to expired tokens:

1. **Identify the error**: Look for token expiration messages in the error
2. **Determine the profile**: Check which AWS profile was being used (look for `AWS_PROFILE` in MCP server config)
3. **Run the refresh command**: `aws sso login --profile <profile-name>`
4. **Wait for authentication**: Inform the user to complete browser authentication
5. **Retry the operation**: Once refreshed, retry the original AWS operation

## Example Interaction

**User runs a Bedrock KB query that fails:**

```
Error: Token has expired and refresh failed
```

**You should:**

1. Recognize this as an SSO expiration error
2. Check the MCP server config for the AWS_PROFILE (e.g., `MCPServerReadAccess`)
3. Run: `aws sso login --profile MCPServerReadAccess`
4. Inform the user: "Your AWS SSO session has expired. I'm initiating a refresh - please complete the authentication in your browser."
5. After success, retry the original query

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
