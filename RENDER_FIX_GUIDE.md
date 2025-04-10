# Render Deployment Fix Guide

This guide provides step-by-step instructions to fix the two critical issues with the Discord bot on Render:

1. The "No open ports detected" scanning messages
2. The "ReadableStream is not defined" error causing crashes

## Step 1: Delete Any Existing Web Service

If you created the bot as a "Web Service" on Render:

1. Go to your Render Dashboard
2. Find and select the web service version of your bot
3. Go to "Settings" tab
4. Scroll to the bottom and click "Delete Service"
5. Type the service name to confirm deletion

## Step 2: Create a New Worker Service

1. Go to Render Dashboard
2. Click "New" > "Background Worker"
3. Connect your GitHub repository
4. Configure with these exact settings:
   - **Name**: Choose a name (e.g., "cba-discord-bot")
   - **Environment**: Node
   - **Build Command**: `npm install && chmod +x startup.sh`
   - **Start Command**: `./startup.sh`

## Step 3: Configure Environment Variables

Add ALL of these environment variables:

| Key | Value | Purpose |
|-----|-------|---------|
| DISCORD_TOKEN | Your Discord bot token | Required for bot authentication |
| APPLICATION_ID | Your Discord application ID | Required for slash commands |
| ROBLOX_COOKIE | Your .ROBLOSECURITY cookie | Required for Roblox API |
| ROBLOX_GROUP_ID | Your Roblox group ID | Required for group management |
| DATABASE_URL | PostgreSQL connection URL | Required for database access |
| RENDER_SERVICE_TYPE | worker | Prevents port scanning |
| NODE_OPTIONS | --no-experimental-fetch --no-experimental-global-fetch | Fixes ReadableStream error |
| NO_PORT_SCAN | true | Additional port scan prevention |

## Step 4: Deploy and Monitor

1. Click "Create Background Worker"
2. Wait for the build and deployment to complete
3. Monitor the logs for any errors
4. You should NOT see "No open ports detected" messages
5. You should NOT see "ReadableStream is not defined" errors

## Troubleshooting "Process exited with code 1" Errors

If you still see "Process exited with code 1" errors:

1. **Check Discord Token**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application
   - Navigate to "Bot" section
   - Click "Reset Token" to generate a new token
   - Copy the new token and update the DISCORD_TOKEN environment variable in Render

2. **Check Bot Permissions**:
   - Make sure your bot has the correct scopes and permissions
   - Required scopes: `bot`, `applications.commands`
   - Required permissions: `Send Messages`, `Read Messages/View Channels`, and any others needed for your commands

3. **Force Rebuild**:
   - Go to your worker service in Render
   - Click "Manual Deploy" > "Clear Build Cache & Deploy"
   - This forces a complete rebuild that can resolve dependency issues

## Understanding the Fix

Our solution implements multiple strategies to prevent port scanning:

1. **Special startup script** (`startup.sh`)
   - Sets specific environment variables 
   - Creates marker files that Render checks
   - Fixes Node.js compatibility issues

2. **Node.js compatibility fix**
   - Disables experimental fetch features that cause the ReadableStream error
   - Uses stable, supported Node.js APIs

3. **Render configuration**
   - Explicitly configured as a worker service
   - No port or HTTP settings that would trigger scanning

If you follow all steps in this guide, both issues should be completely resolved.