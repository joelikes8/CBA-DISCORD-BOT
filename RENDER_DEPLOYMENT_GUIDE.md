# Render Deployment Guide

This document provides instructions for deploying the CBA Discord Bot to Render.com.

## Configuration Options

### Option 1: Background Worker (No Web Interface)

If you don't need a web interface and aren't using UptimeRobot:

1. **Service Type**: Background Worker
2. **Build Command**: `npm install`
3. **Start Command**: `bash startup.sh`
4. **Environment Variables**:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `APPLICATION_ID`: Your Discord application ID
   - `ROBLOX_COOKIE`: Your Roblox .ROBLOSECURITY cookie
   - `ROBLOX_GROUP_ID`: Your Roblox group ID
   - `DATABASE_URL`: PostgreSQL connection string
   - `RENDER_SERVICE_TYPE`: Set to `worker`
   - `NO_PORT_SCAN`: Set to `true`
   - `NODE_NO_WARNINGS`: Set to `1`

### Option 2: Web Service (With Web Interface)

If you need a web interface or are using UptimeRobot:

1. **Service Type**: Web Service
2. **Build Command**: `npm install`
3. **Start Command**: `bash web-startup.sh`
4. **Environment Variables**:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `APPLICATION_ID`: Your Discord application ID
   - `ROBLOX_COOKIE`: Your Roblox .ROBLOSECURITY cookie
   - `ROBLOX_GROUP_ID`: Your Roblox group ID
   - `DATABASE_URL`: PostgreSQL connection string
   - `NODE_NO_WARNINGS`: Set to `1`
   - `UNDICI_NO_READABLE_STREAM`: Set to `1`
   - `NO_UNDICI_FETCH`: Set to `1`

## UptimeRobot Configuration

If using UptimeRobot to keep your bot alive:

1. Use Option 2 (Web Service) above
2. Set up a monitor in UptimeRobot for `https://your-app-name.onrender.com/health`
3. Set the monitoring interval to 5-10 minutes

## Web Endpoints

When using the web service option, the following endpoints are available:

- `/`: Basic status page showing bot configuration
- `/health`: Health check endpoint (returns 200 OK if the bot is running)
- `/status`: JSON status information about the bot

## Troubleshooting

### Bad Gateway Errors

If you see "Bad Gateway" when accessing your Render URL:

1. Check that you're using the correct start command (`web-startup.sh` for web services)
2. Verify that the PORT environment variable is being used correctly
3. Check Render logs for any startup errors

### ReadableStream Errors

If you see errors like "ReadableStream is not defined":

1. Make sure you're using the correct startup script (`startup.sh` or `web-startup.sh`)
2. Set the `NODE_NO_WARNINGS=1`, `UNDICI_NO_READABLE_STREAM=1`, and `NO_UNDICI_FETCH=1` environment variables
3. If errors persist, try using the extreme compatibility fix with:
   ```
   NODE_OPTIONS="--require ./extreme-fix.js" node index.js
   ```