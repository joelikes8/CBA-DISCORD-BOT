# Deploying CBA Discord Bot to Render

This guide will walk you through the process of deploying your Discord bot to Render.com.

## Prerequisites

1. A Render.com account (you can sign up for free at https://render.com)
2. Your GitHub repository with the bot code
3. Your bot's required environment variables:
   - `DISCORD_TOKEN`
   - `APPLICATION_ID`
   - `ROBLOX_COOKIE`
   - `ROBLOX_GROUP_ID`
   - `DATABASE_URL` (Render can provide a PostgreSQL database)

## Deployment Steps

### Option 1: Deploy with Render Blueprint (Recommended)

1. Log in to your Render account
2. Click the "New +" button and select "Blueprint"
3. Connect your GitHub account if you haven't already
4. Select the repository with your bot code
5. Render will automatically detect the `render.yaml` file
6. Click "Apply" to create the service
7. Enter your environment variables when prompted
8. Wait for the deployment to complete

### Option 2: Deploy Manually

1. Log in to your Render account
2. Click the "New +" button and select "Web Service"
3. Connect your GitHub account if you haven't already
4. Select the repository with your bot code
5. Configure the following settings:
   - **Name**: `cba-discord-bot` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free (or select a paid plan if needed)
6. Click "Advanced" and add your environment variables:
   - `DISCORD_TOKEN`
   - `APPLICATION_ID`
   - `ROBLOX_COOKIE`
   - `ROBLOX_GROUP_ID`
   - `DATABASE_URL`
7. Click "Create Web Service"
8. Wait for the deployment to complete

## Setting Up a PostgreSQL Database on Render

1. In your Render dashboard, click the "New +" button and select "PostgreSQL"
2. Configure your database settings:
   - **Name**: `cba-bot-db` (or any name you prefer)
   - **Database**: `cba_bot` (or any name you prefer)
   - **User**: Leave the default or set a custom username
   - **Plan**: Free (or select a paid plan if needed)
3. Click "Create Database"
4. Once created, go to your database dashboard and find the "Connection" tab
5. Copy the "Internal Database URL" - this is what you'll use for your `DATABASE_URL` environment variable

## Before First Deployment

Before your first deployment, make sure to:

1. Replace the `package.json` file with `package.json.render` (rename it to `package.json`)
2. Make sure your `.gitignore` file is correctly set up to avoid pushing sensitive data
3. Deploy your Discord bot commands by running the command feature on Render after deployment:
   - Go to your service dashboard
   - Click "Shell" in the top right
   - Run `node deploy-commands.js`

## Monitoring Your Bot

1. After deployment, you can monitor your bot through Render's logs
2. Go to your service dashboard and click "Logs" to see real-time logs
3. Set up alerts in Render to get notified of any issues

## Updating Your Bot

To update your bot:
1. Push changes to your GitHub repository
2. Render will automatically redeploy your bot with the new code

If you need to make manual changes:
1. Go to your service dashboard
2. Click "Manual Deploy" and select "Deploy latest commit"