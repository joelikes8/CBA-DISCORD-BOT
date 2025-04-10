# CBA Discord Bot

A sophisticated Discord bot for the Roblox British Army group, featuring advanced server management and intelligent automation tools with robust error handling and deployment strategies.

## Features

- Roblox group integration
- User verification system
- Rank management
- Anti-raid protection
- Server moderation tools
- Tryout management
- Advanced error handling

## Technical Architecture

This Discord bot uses:
- Discord.js for Discord API interaction
- Noblox.js for Roblox API integration
- PostgreSQL for data persistence
- Node.js runtime environment
- Render for cloud deployment

## Deployment

This project is specifically configured for deployment on Render as a background worker service (the correct way to host Discord bots).

### Render Deployment Quick Guide

1. Create a new **Background Worker** service in Render (not Web Service)
2. Configure build settings:
   - Build Command: `npm install && chmod +x startup.sh`
   - Start Command: `./startup.sh`
3. Add environment variables (see below)
4. Deploy

For detailed instructions, see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

### Required Environment Variables

- `DISCORD_TOKEN` - Your Discord bot token
- `APPLICATION_ID` - Your Discord application ID
- `ROBLOX_COOKIE` - Your Roblox .ROBLOSECURITY cookie
- `ROBLOX_GROUP_ID` - Your Roblox group ID
- `DATABASE_URL` - PostgreSQL connection string
- `RENDER_SERVICE_TYPE` - Set to `worker`
- `NODE_NO_WARNINGS` - Set to `1`
- `NO_PORT_SCAN` - Set to `true`

## Development

### Running Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables
4. Run the bot: `node -r ./preload.js index.js`

### Command Deployment

To deploy slash commands:
```
node deploy-commands.js
```

### Pre-Deployment Check

Run the provided script to check if your project is ready for Render deployment:
```
./render-check.sh
```

## Special Compatibility Features

This project includes special compatibility features to ensure smooth operation on Render:

1. **ReadableStream Patching**: Discord.js and its dependencies require ReadableStream which isn't available in all Node.js environments. This project includes patching that resolves these issues.

2. **Worker Service Configuration**: Prevents port scanning messages from Render by correctly signaling this is a background worker not a web service.

3. **Error Recovery**: Implements automatic recovery and restart mechanisms for increased stability.

## License

This project is licensed under the ISC License.