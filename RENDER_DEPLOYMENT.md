# Render Deployment Guide for CBA Discord Bot

This guide will walk you through deploying the CBA Discord Bot to Render as a background worker service (which is the correct way to host Discord bots).

## Important: This is NOT a Web Service

Discord bots connect directly to Discord's API and do not need to expose HTTP ports or serve web content. Render offers a "Background Worker" service type specifically designed for this kind of application.

## Deployment Steps

### 1. Create a New Background Worker Service

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click "New" and select "Background Worker"
3. Connect your GitHub repository

### 2. Configure Build Settings

- **Name**: Choose a name for your service (e.g., `cba-discord-bot`)
- **Root Directory**: Leave blank (uses repository root)
- **Runtime**: Node
- **Build Command**: `npm install && chmod +x startup.sh`
- **Start Command**: `./startup.sh`

### 3. Add Environment Variables

Add the following environment variables:

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Your Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications) |
| `APPLICATION_ID` | Your Discord application ID (found in General Information tab) |
| `ROBLOX_COOKIE` | Your Roblox .ROBLOSECURITY cookie |
| `ROBLOX_GROUP_ID` | Your Roblox group ID |
| `DATABASE_URL` | PostgreSQL connection string |
| `RENDER_SERVICE_TYPE` | Set to `worker` |
| `NODE_NO_WARNINGS` | Set to `1` |
| `NO_PORT_SCAN` | Set to `true` |

### 4. Deploy the Service

- Click "Create Background Worker"
- Wait for the build and deployment to complete

## Troubleshooting

### Port Scanning Messages

If you see messages like:
```
==> No open ports detected, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
```

These messages are normal for a worker service and can be ignored. The Discord bot doesn't need to expose any HTTP ports since it connects directly to Discord's API.

### ReadableStream Errors

If deployment fails with error messages related to `ReadableStream is not defined`, the fix is already included in this repository with:

1. `preload.js` - Preloads compatibility fixes
2. `monkey-patch.js` - Replaces problematic modules
3. `startup.sh` - Sets the proper environment and launches the bot

### Bot Not Responding

If the bot deploys successfully but isn't responding:

1. Check your `DISCORD_TOKEN` and `APPLICATION_ID` are correct
2. Verify the bot has been invited to your server with the correct permissions
3. Look at the Render logs for specific error messages
4. Check that all slash commands were deployed successfully

### Database Connection Issues

If you see database connection errors:

1. Verify your `DATABASE_URL` environment variable
2. Make sure your PostgreSQL database server is accessible from Render
3. Check for any IP restrictions or firewall rules

## Deployment Validation

To verify your bot is running correctly:

1. Check the logs in the Render dashboard
2. Look for the message `[INFO] Ready! Logged in as YourBot#1234`
3. Try using a slash command in your Discord server

## Auto-Restart and Reliability

This deployment includes:

- Automatic command redeployment on startup
- Error recovery with automatic restarts
- Detailed logging to help diagnose issues
- Special Render compatibility fixes

For any persistent issues, please check the full logs in the Render dashboard or consult the project repository.