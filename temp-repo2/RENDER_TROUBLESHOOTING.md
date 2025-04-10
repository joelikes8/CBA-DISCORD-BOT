# Render Deployment Troubleshooting Guide

This guide helps you troubleshoot common issues with the Discord bot deployment on Render.

## "Process exited with code 1" Error

If you see the error message `[BOT] Process exited with code 1` repeatedly in your logs, followed by `[BOT] Restarting in 30 seconds...`, this indicates that the bot is crashing immediately after starting.

### Common Causes and Solutions:

1. **Invalid Discord Token**
   - Verify your `DISCORD_TOKEN` is correct in Render environment variables
   - Make sure the token hasn't been reset or revoked in Discord Developer Portal
   - Solution: Generate a new token in Discord Developer Portal and update the environment variable

2. **Missing Environment Variables**
   - All required environment variables must be set:
     - `DISCORD_TOKEN`
     - `APPLICATION_ID`
     - `ROBLOX_COOKIE`
     - `ROBLOX_GROUP_ID`
     - `DATABASE_URL`
   - Solution: Check all environment variables are set in Render dashboard

3. **Database Connection Issues**
   - The bot may be unable to connect to the PostgreSQL database
   - Solution: Verify your `DATABASE_URL` is correct and the database is accessible

4. **Discord API Rate Limiting**
   - Rapid restarts can trigger Discord API rate limits
   - Solution: Wait 1-2 hours for rate limits to reset before deploying again

5. **Service Type Issues**
   - Make sure you've selected "Background Worker" as the service type, not "Web Service"
   - Solution: Create a new service with the correct type if needed

## Port Scanning Messages

If you see messages like:
```
==> No open ports detected, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
```

These messages are normal for a worker service and can be ignored. The Discord bot doesn't need to expose any HTTP ports since it connects directly to Discord's API.

## Viewing Detailed Logs

For more detailed error information:

1. Go to your service in the Render dashboard
2. Click on the "Logs" tab
3. Look for error messages between restart cycles
4. Pay special attention to messages starting with `[BOT ERROR]` and `[FATAL ERROR]`

## Manual Restart

If the bot is stuck in a restart loop:

1. Go to your service in the Render dashboard
2. Click "Manual Deploy" > "Clear Build Cache & Deploy"
3. This forces a fresh deployment that may resolve the issue

## Still Having Problems?

If you've tried all the above solutions and are still experiencing issues, please check:

1. Your Discord bot has the correct permissions and scopes set in the Discord Developer Portal
2. The bot token and application ID match for the same bot application
3. Your Roblox cookie is valid and not expired

For more help, contact Discord support or Render support.