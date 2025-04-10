# Render Worker Deployment Guide

This guide explains how to deploy the Discord bot as a background worker service on Render.

## IMPORTANT: PREVENTING PORT SCANNING MESSAGES

The Discord bot uses a special configuration to prevent the "No open ports detected" scanning messages. 
This is achieved through:

1. Using a dedicated `render-worker.js` entry point
2. Setting the `RENDER_SERVICE_TYPE=worker` environment variable
3. Creating a `.render-no-web-service` file during startup

## Deployment Steps

1. **Create a new service on Render**
   - Sign in to your Render dashboard
   - Click "New" and select "Background Worker" (NOT "Web Service")

2. **Connect to your GitHub repository**
   - Select the GitHub repository where your bot code is stored
   - If you don't see your repository, you may need to configure GitHub integration

3. **Configure the service**
   - **Name**: Choose a name for your service (e.g., "cba-discord-bot")
   - **Environment**: Select "Node"
   - **Build Command**: `npm install && echo "WORKER_SERVICE=true" > .env.render`
   - **Start Command**: `node render-worker.js`
   - **Plan**: Select your plan (Free tier works fine)

4. **Set environment variables**
   - Click "Environment" and add the following variables:
   
   | Key | Value | Description |
   |-----|-------|-------------|
   | DISCORD_TOKEN | Your token | From Discord Developer Portal |
   | APPLICATION_ID | Your app ID | From Discord Developer Portal |
   | ROBLOX_COOKIE | Your cookie | .ROBLOSECURITY cookie value |
   | ROBLOX_GROUP_ID | Your group ID | Roblox group ID number |
   | DATABASE_URL | DB connection string | PostgreSQL connection URL |
   | RENDER_SERVICE_TYPE | worker | Tells Render this is not a web service |

5. **Deploy the service**
   - Click "Create Background Worker"
   - Wait for the build and deployment to complete

## FIXING "Process exited with code 1" ERRORS

If your bot is continuously restarting with "Process exited with code 1", check:

1. **Discord Token Issues:**
   - Verify the token is correct and not expired
   - Check permissions and intents in Discord Developer Portal
   - Generate a new token if needed

2. **Environment Variables:**
   - Make sure ALL required variables are set
   - Check for typos in variable names or values

3. **Render Dashboard Fixes:**
   - Go to your service in Render dashboard
   - Click "Manual Deploy" > "Clear Build Cache & Deploy"
   - Watch the logs for specific error messages

4. **Check Log Details:**
   - The new `render-worker.js` script includes improved diagnostics
   - Look for messages after "[DIAGNOSTIC]" in the logs
   - These will help identify specific token or connection issues

## DO NOT CREATE A WEB SERVICE

This bot is specifically designed to run as a background worker. Do not:
- Create it as a "Web Service" in Render
- Modify the code to bind to a port
- Add Express or other web server code

The bot communicates directly with Discord through their API and does not need HTTP capability.

## Maintenance

- To update your bot, simply push changes to the connected GitHub repository
- Render will automatically rebuild and redeploy your service
- The bot includes built-in crash recovery and error handling