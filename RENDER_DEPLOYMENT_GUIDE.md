# Render Deployment Guide for Discord Bot

This guide will walk you through deploying your Discord bot on Render's free tier web service.

## Overview

Unlike paid background worker services, this bot is designed to work on Render's free tier by:
1. Running a small web server that responds to HTTP requests (required for free tier)
2. Running the Discord bot as a background process within the web service
3. Using special fixes for ReadableStream compatibility issues

## Prerequisites

Before deploying, make sure you have:

- A Discord bot token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Your bot's Application ID
- A Roblox Cookie (.ROBLOSECURITY)
- Your Roblox Group ID

## Deployment Steps

### Option 1: Deploy with render.yaml (Recommended)

1. Login to your Render account
2. Navigate to the Dashboard
3. Click on "New" and select "Blueprint"
4. Connect your GitHub repository containing this bot
5. Render will automatically detect the `render.yaml` file and set up the service
6. Set your environment variables in the Render Dashboard:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `APPLICATION_ID`: Your bot's application ID
   - `ROBLOX_COOKIE`: Your Roblox cookie (.ROBLOSECURITY=_|WARNING:-...)
   - `ROBLOX_GROUP_ID`: Your Roblox group ID
7. Click "Apply" to create the service

### Option 2: Manual Setup

If you prefer to set up manually:

1. Login to your Render account
2. Create a new Web Service (not a Background Worker)
3. Connect to your GitHub repository
4. Configure the service:
   - **Name**: discord-bot (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the region closest to you
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `npm install && chmod +x web-startup.sh`
   - **Start Command**: `./web-startup.sh`
5. Add the environment variables:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `APPLICATION_ID`: Your bot's application ID
   - `ROBLOX_COOKIE`: Your Roblox cookie
   - `ROBLOX_GROUP_ID`: Your Roblox group ID
   - `NODE_VERSION`: 20.x
6. Create a PostgreSQL database:
   - In the Render dashboard, go to "New" and select "PostgreSQL"
   - Choose a name for your database
   - Select the free plan
   - After creation, go to your database settings and copy the Internal Database URL
7. Add the database connection:
   - Go back to your web service
   - Add a new environment variable `DATABASE_URL` with the Internal Database URL

## Monitoring and Troubleshooting

Once deployed, you can monitor your bot:

1. The web interface will be available at your Render URL (e.g., https://your-service.onrender.com)
2. Check the status page at https://your-service.onrender.com/status
3. View logs in the Render dashboard
4. If you're experiencing issues:
   - Check the "Logs" tab in Render dashboard
   - Ensure all environment variables are set correctly
   - Verify your Discord token and Roblox cookie are valid

## ReadableStream Compatibility

This bot uses a special fix for ReadableStream compatibility issues on Render:

1. `extreme-fix.js` provides global replacements for problematic APIs
2. `web-startup.sh` ensures these fixes are applied before starting the bot
3. If you're still seeing ReadableStream errors, check the logs and ensure you're using the correct startup script

## Health Checks

Render uses health checks to determine if your service is running correctly:

- The bot provides a `/health` endpoint
- Render will automatically ping this endpoint
- If the endpoint stops responding, Render may restart your service

## Common Issues and Solutions

### Discord Connection Problems

- **Error**: `[ERROR] Failed to log in: TokenInvalid`
  - **Solution**: Your Discord token is invalid. Generate a new token in the Discord Developer Portal.

- **Error**: `[ERROR] Failed to deploy commands`
  - **Solution**: Ensure your APPLICATION_ID is correct and your bot has the applications.commands scope.

### Roblox API Issues

- **Error**: `[ERROR] Failed to authenticate with Roblox`
  - **Solution**: Your Roblox cookie may be expired. Get a fresh cookie from the Roblox website.

- **Warning**: `No Roblox warning detected in provided cookie`
  - **Solution**: Make sure to include the full `.ROBLOSECURITY=_|WARNING:-DO-NOT-SHARE-THIS...` cookie.

### Database Issues

- **Error**: `[ERROR] Failed to connect to the database`
  - **Solution**: Check that your DATABASE_URL is correct and the database is created.

- **Error**: `Verification data is incomplete`
  - **Solution**: Make sure your database tables are initialized. Run a test with `node test-pending-verification.js`.

## Keeping Your Bot Alive

The free tier on Render:
- May spin down after 15 minutes of inactivity
- Has a limited number of runtime hours per month

To keep your bot active:
1. The `/health` endpoint helps keep the service running
2. The web server is designed to respond quickly to prevent Render from marking it as inactive
3. Consider using an external service like UptimeRobot to ping your health endpoint regularly