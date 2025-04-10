# Render Python Worker Deployment Guide

This guide specifically explains how to deploy the Python version of the Discord bot to Render for 24/7 uptime.

## Python Version Deployment Steps

1. **Create a New Service on Render**
   - Click **New** and select **Background Worker**
   - Connect your GitHub repository
   - Name your service (e.g., `cba-discord-bot-python`)

2. **Configure Build Settings for Python**
   - Build Command: `pip install -r python_version/requirements.txt`
   - Start Command: `python python_version/start_bot.py`
   - Select **Free** plan

3. **Set Environment Variables**
   The same environment variables are needed for both Node.js and Python versions:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `APPLICATION_ID`: Your Discord application ID
   - `ROBLOX_COOKIE`: Your Roblox account cookie
   - `ROBLOX_GROUP_ID`: Your Roblox group ID
   - `DATABASE_URL`: PostgreSQL database connection URL

4. **Advanced Options**
   - Auto-Deploy: Enable
   - Branch: `main` (or your default branch)

## Python Bot 24/7 Uptime Setup

The Python version includes these features to ensure 24/7 uptime:

1. **Robust error handling** - Catches exceptions to prevent crashes
2. **Automatic reconnection** - Reconnects to Discord if connection is lost
3. **Detailed logging** - Records all bot activity for troubleshooting

## Python Bot Structure

The Python version is structured as follows:

- `start_bot.py` - Starter script with error handling and automatic restart
- `bot.py` - Main bot file that handles Discord integration
- `database.py` - Database connection and operations
- `roblox_api.py` - Roblox API interaction

## Future Improvements

Once the Python version is fully implemented, consider these improvements:

1. **Command Cogs** - Organize commands into cogs for better structure
2. **Advanced Error Handling** - Add more specific error handling
3. **Rate Limiting** - Implement command cooldowns to prevent abuse

## Switching Between Versions

To switch between the Node.js and Python versions:

1. In the Render dashboard, go to your service settings
2. Update the build and start commands
3. Redeploy the service

## Troubleshooting Python-Specific Issues

If you encounter issues with the Python version:

1. **ModuleNotFoundError** - Make sure all dependencies are in requirements.txt
2. **Discord API errors** - Check your bot token and permissions
3. **Database connection issues** - Verify DATABASE_URL format and credentials

## Support

If you need help with Python deployment, contact:
- GitHub Issues: Create an issue in the repository
- Discord: Contact the development team through Discord