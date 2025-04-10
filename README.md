# CBA Discord Bot

A Discord bot for a Roblox British army group with verification, rank management, tryout organization, and blacklist checking features.

## Features

- **Verification System**: Link Discord users to their Roblox accounts
- **Rank Management**: Update ranks within the Roblox group directly from Discord
- **Tryout Organization**: Manage and organize tryouts for new recruits
- **Blacklist Checking**: Check if users are in blacklisted groups
- **Moderation Commands**: Ban, kick, mute, warn, and purge commands
- **Anti-Raid Protection**: Protect your server from raids and spam

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up the following environment variables:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `APPLICATION_ID`: Your Discord application ID
   - `ROBLOX_COOKIE`: Your Roblox security cookie
   - `ROBLOX_GROUP_ID`: Your Roblox group ID
   - `DATABASE_URL`: PostgreSQL database connection string
4. Deploy commands with `node deploy-commands.js`
5. Start the bot with `node index.js`

## Commands

- `/verify` - Link your Discord account to Roblox
- `/update` - Update your rank or another user's rank
- `/reverify` - Reverify a user if needed
- `/ban`, `/kick`, `/mute`, `/warn` - Moderation commands
- `/antiraid` - Configure anti-raid settings
- `/blacklisted` - Manage blacklisted groups
- `/host` - Host a tryout session
- And more...

## License

This project is private and intended for use by CBA only.