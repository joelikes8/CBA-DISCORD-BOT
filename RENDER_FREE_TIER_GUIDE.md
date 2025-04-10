# Render Free Tier Deployment Guide

This guide helps you deploy the Discord bot to Render's free tier web service.

## Why Use the Web Service?

Render's free tier doesn't include background worker services (which cost money). Instead, we've created a special setup that runs the Discord bot inside a web service, which is available on the free tier.

## Deployment Steps

1. **Go to Render Dashboard**
   - Log in to your Render account at https://dashboard.render.com

2. **Create a New Web Service**
   - Click "New" and select "Web Service"
   - Connect your GitHub repository

3. **Configure the Service**
   - Name: Choose a name (e.g., "discord-bot-web")
   - Environment: Node
   - Build Command: `npm install && chmod +x web-startup.sh`
   - Start Command: `./web-startup.sh`
   - Instance Type: Free

4. **Set Environment Variables**
   Add these required environment variables:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `APPLICATION_ID`: Your Discord application ID
   - `ROBLOX_COOKIE`: Your Roblox .ROBLOSECURITY cookie
   - `ROBLOX_GROUP_ID`: Your Roblox group ID
   - `DATABASE_URL`: Your PostgreSQL database URL

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your service

## How It Works

The web service wrapper:
1. Creates a simple HTTP server on the port Render expects
2. Runs the Discord bot as a background process with special fixes
3. Directly patches problematic modules to fix ReadableStream errors
4. Provides health check endpoints for Render
5. Automatically restarts the bot if it crashes

## Extreme ReadableStream Error Fix

The deployment includes our most aggressive solution yet for the ReadableStream error:

1. The `extreme-fix.js` script:
   - **Completely hijacks** Node.js module loading system
   - Intercepts and replaces problematic modules before they're loaded
   - Provides complete mock implementations of all web APIs
   - Completely bypasses the undici ReadableStream implementation

2. Multiple layers of protection:
   - Module loader interception for complete control
   - Direct replacement of problematic module content
   - Global polyfills for all required web APIs
   - Special environment variables to disable problematic features
   - Runtime interception of module loading

This extreme approach ensures the Discord bot will work even in Render's limited environment by preventing the problematic code from ever being loaded.

## Verifying Deployment

After deployment:
1. Wait for the service to show "Live" status
2. Check the logs to ensure the Discord bot connected successfully
3. Visit your service URL to see the status page

## Troubleshooting

If the bot still fails to start:
1. Check Render logs for any errors
2. Verify all environment variables are set correctly
3. Ensure your Discord bot token and Roblox cookie are valid
4. Try redeploying - the direct fix script may need a fresh start

## Maintaining the Service

Render's free tier web services will sleep after 15 minutes of inactivity. To keep your bot running 24/7:
1. Consider upgrading to a paid plan
2. Or use a service like UptimeRobot to ping your web service URL every few minutes

## Security Note

This configuration keeps your bot token and credentials secure while working around Render's free tier limitations.