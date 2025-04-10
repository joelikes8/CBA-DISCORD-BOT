# Deploying CBA Discord Bot as a Background Worker on Render

Discord bots should be deployed as background workers rather than web services, as they don't respond to HTTP requests but instead connect to Discord's gateway. Here's how to properly set up your bot on Render:

## Steps for Manual Deployment

1. Log in to your Render account
2. Click the "New +" button
3. Select "Background Worker" (not Web Service)
4. Connect your GitHub repository
5. Configure the following:
   - **Name**: `cba-discord-bot` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node deploy-commands.js && node index.js`
   - **Plan**: Free (or select a paid plan if needed)

## Environment Variables Setup

In the "Environment" section, add all the required variables:
- `DISCORD_TOKEN` (Your Discord bot token)
- `APPLICATION_ID` (Your bot's application ID)
- `ROBLOX_COOKIE` (Your Roblox security cookie)
- `ROBLOX_GROUP_ID` (Your Roblox group ID)
- `DATABASE_URL` (Your PostgreSQL database connection string)

## Troubleshooting Deployment Issues

If your deployment fails, check these common issues:

1. **Environment Variables**: Make sure all required variables are set correctly
2. **Database Connection**: Verify your DATABASE_URL is correct and accessible from Render
3. **Error Logs**: Check the Render logs for specific error messages
4. **Memory Issues**: If the bot crashes due to memory limits, consider upgrading your plan

## Best Practices

1. **Auto-Deploy**: Keep auto-deploy enabled so your bot updates when you push to GitHub
2. **Monitoring**: Set up health checks and notifications in Render
3. **Database Management**: Use Render's PostgreSQL service for reliable database hosting
4. **Security**: Never commit sensitive environment variables to your repository

If you encounter any issues with deployment, contact Render support or check their documentation at https://render.com/docs