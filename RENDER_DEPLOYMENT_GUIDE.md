# Render Deployment Guide

This guide explains how to deploy the Discord bot to Render for 24/7 uptime.

## Deployment Options

### Node.js Version (Current)

The main version of the bot is built with Node.js and is ready for deployment on Render as a background worker.

### Python Version (In Development)

A Python version of the bot is currently under development, which will provide easier management in the future.

## Setting Up on Render

1. **Create a Render Account**
   - Sign up at [render.com](https://render.com)

2. **Create a New Service**
   - Click **New** and select **Background Worker**
   - Connect your GitHub repository
   - Name your service (e.g., `cba-discord-bot`)

3. **Configure Build Settings**
   - Build Command: `npm install`
   - Start Command: `node start-bot.js`
   - Select **Free** plan

4. **Set Environment Variables**
   Go to the **Environment** tab and add the following:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `APPLICATION_ID`: Your Discord application ID
   - `ROBLOX_COOKIE`: Your Roblox account cookie
   - `ROBLOX_GROUP_ID`: Your Roblox group ID
   - `DATABASE_URL`: PostgreSQL database connection URL

5. **Advanced Options**
   - Auto-Deploy: Enable
   - Branch: `main` (or your default branch)

## Monitoring Your Bot

- Render provides logs for monitoring your bot's performance
- You can view them in the **Logs** tab of your service
- Check for any errors or issues that might indicate problems

## Keep Bot Online 24/7

The deployment is configured with:

1. **Automatic crash recovery** - The bot will restart if it crashes
2. **Heartbeat mechanism** - Regular checking to ensure the bot stays active
3. **Error handling** - Proper logging of errors for debugging

## Switching to Python Version (Future)

When the Python version is ready:

1. Update the build and start commands:
   - Build Command: `pip install -r python_version/requirements.txt`
   - Start Command: `python python_version/bot.py`

2. Configure environment variables as above

## Troubleshooting

If you encounter issues:

1. Check the logs in Render dashboard
2. Verify all environment variables are correctly set
3. Ensure your Discord bot token is valid
4. Confirm your Roblox cookie is not expired

## Support

If you need help with deployment, contact:
- GitHub Issues: Create an issue in the repository
- Discord: Contact the development team through Discord