# Complete Guide to Fix Render Deployment Issues

This guide provides a comprehensive solution for the two common problems with Discord bots on Render:
1. ReadableStream errors
2. Port scanning messages

## Problem #1: ReadableStream Errors

**Error message:**
```
ReferenceError: ReadableStream is not defined
```

This happens because Discord.js and its dependencies try to use the `ReadableStream` API which is not available in all Node.js environments, particularly on Render's platform.

### Solution: Advanced Module Patching

Our solution uses a technique called "monkey patching" to replace the problematic modules with compatible versions:

1. **monkey-patch.js** - Completely replaces undici/fetch modules with working implementations
2. **fixed-bot.js** - Special entry point that applies the patches before loading Discord.js
3. **startup.sh** - Script that sets up the right environment and launches the bot

## Problem #2: Port Scanning Messages

**Error message:**
```
Error R10 (Boot timeout) -> Web service failed to bind to $PORT within 60 seconds of launch
```

This happens because Render tries to scan for a web server even when your bot doesn't need one.

### Solution: Worker Configuration

Our solution uses several techniques to disable port scanning:

1. Set `RENDER_SERVICE_TYPE=worker` environment variable
2. Create marker files indicating this is a worker service
3. Use an invalid port to prevent binding attempts

## How to Deploy to Render

Follow these exact steps for a successful deployment:

1. **Create a new service in Render**:
   - Select "Background Worker" (not Web Service)
   - Connect to your GitHub repository

2. **Configure build settings**:
   - Build Command: `npm install && chmod +x startup.sh`
   - Start Command: `./startup.sh`

3. **Add required environment variables**:
   - `DISCORD_TOKEN` - Your Discord bot token
   - `APPLICATION_ID` - Your Discord application ID
   - `ROBLOX_COOKIE` - Your Roblox .ROBLOSECURITY cookie
   - `ROBLOX_GROUP_ID` - Your Roblox group ID
   - `DATABASE_URL` - PostgreSQL connection string
   - `RENDER_SERVICE_TYPE` - Set to `worker`
   - `NODE_NO_WARNINGS` - Set to `1`
   - `NO_PORT_SCAN` - Set to `true`

4. **Deploy the service**:
   - Click "Create Background Worker"
   - Wait for the build and deployment to complete

5. **For existing services**:
   - Update the Start Command to `./startup.sh`
   - Use "Clear Build Cache & Deploy" for a clean start

## Troubleshooting

If you still encounter issues:

1. **Check environment variables**:
   - Make sure all required variables are set correctly
   - Verify DISCORD_TOKEN is valid and not expired

2. **Review Render logs**:
   - Look for "[MONKEY-PATCH]" and "[STARTUP]" messages
   - Check for specific error messages

3. **Force a clean deployment**:
   - Use "Clear Build Cache & Deploy" in Render dashboard

## How This Solution Works

Our approach uses three layers of protection:

1. **Environment preparation**:
   - Sets special variables to disable problematic features
   - Creates marker files to prevent port scanning

2. **Module patching**:
   - Intercepts require() calls for problematic modules
   - Provides compatible implementations

3. **Error handling**:
   - Catches and handles any remaining errors
   - Prevents crashes from non-critical issues

This ensures your Discord bot runs reliably on Render's platform with 24/7 uptime.

## Additional Options

For users with persistent issues, consider:

1. **Python Version**: We've also developed a Python version in the `python_version` folder that has fewer compatibility issues.

2. **Alternative Hosting**: For mission-critical bots, consider a VM-based hosting solution.