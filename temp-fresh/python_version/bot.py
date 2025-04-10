import os
import discord
import asyncio
import logging
from discord.ext import commands
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('discord_bot')

# Load environment variables
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')
APPLICATION_ID = os.getenv('APPLICATION_ID')

# Set up the bot
intents = discord.Intents.default()
intents.members = True
intents.message_content = True

bot = commands.Bot(command_prefix='!', intents=intents)

# Event: Bot is ready
@bot.event
async def on_ready():
    logger.info(f'Logged in as {bot.user.name} ({bot.user.id})')
    logger.info(f'Bot is ready to serve on {len(bot.guilds)} servers')
    
    # Sync commands with Discord
    logger.info('Syncing commands with Discord...')
    try:
        await bot.tree.sync()
        logger.info('Commands synced successfully!')
    except Exception as e:
        logger.error(f'Failed to sync commands: {e}')

# Event: Member joins the server
@bot.event
async def on_member_join(member):
    logger.info(f'Member joined: {member.name}#{member.discriminator}')
    
    # Send welcome message
    try:
        welcome_channel = discord.utils.get(member.guild.text_channels, name='welcome')
        if welcome_channel:
            await welcome_channel.send(f'Welcome to the server, {member.mention}! Please use `/verify` to link your Roblox account.')
    except Exception as e:
        logger.error(f'Error sending welcome message: {e}')

# Verify command
@bot.hybrid_command(name='verify', description='Link your Discord account to your Roblox account')
async def verify(ctx):
    await ctx.defer()
    
    await ctx.send("This is a sample verification command. In a full implementation, this would handle Roblox verification.")

# Update rank command
@bot.hybrid_command(name='update', description='Update your rank or another user\'s rank')
async def update(ctx, user: discord.Member = None):
    await ctx.defer()
    
    target = user or ctx.author
    await ctx.send(f"This is a sample update command. In a full implementation, this would update {target.mention}'s rank.")

# Blacklisted groups command
@bot.hybrid_command(name='blacklisted', description='Manage blacklisted groups')
async def blacklisted(ctx):
    await ctx.defer()
    
    await ctx.send("This is a sample blacklisted command. In a full implementation, this would show or modify blacklisted groups.")

# Load extensions (cogs)
async def load_extensions():
    for filename in os.listdir('./cogs'):
        if filename.endswith('.py'):
            try:
                await bot.load_extension(f'cogs.{filename[:-3]}')
                logger.info(f'Loaded extension: {filename}')
            except Exception as e:
                logger.error(f'Failed to load extension {filename}: {e}')

# Error handler
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        return
    
    logger.error(f'Command error: {error}')
    await ctx.send(f"An error occurred: {error}")

# Main function
async def main():
    async with bot:
        # Load extensions
        # await load_extensions()  # Uncomment when you have cogs
        
        # Start the bot
        await bot.start(TOKEN)

# Run the bot
if __name__ == '__main__':
    asyncio.run(main())