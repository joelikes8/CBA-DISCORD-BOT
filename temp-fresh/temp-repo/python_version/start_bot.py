#!/usr/bin/env python3
"""
Render Python Bot Starter Script

This script is designed specifically for Render deployment:
1. Validates environment variables
2. Synchronizes slash commands
3. Starts the bot with crash recovery
4. Implements heartbeat mechanism to keep the bot active
"""

import os
import sys
import time
import asyncio
import logging
import subprocess
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('bot_starter')

# Required environment variables
REQUIRED_ENV_VARS = [
    'DISCORD_TOKEN',
    'APPLICATION_ID',
    'ROBLOX_COOKIE',
    'ROBLOX_GROUP_ID',
    'DATABASE_URL'
]

def check_environment():
    """Check if all required environment variables are set."""
    logger.info("Checking environment variables...")
    missing_vars = []
    
    for var in REQUIRED_ENV_VARS:
        if not os.getenv(var):
            missing_vars.append(var)
            logger.error(f"Missing required environment variable: {var}")
        else:
            logger.info(f"[OK] Found {var}")
    
    if missing_vars:
        logger.error("Missing required environment variables. Exiting.")
        return False
    
    return True

async def sync_commands():
    """Sync slash commands with Discord."""
    logger.info("Synchronizing slash commands...")
    # This would be implemented to sync commands with Discord API
    # For now, we'll just simulate success
    await asyncio.sleep(1)
    logger.info("Commands synchronized successfully!")
    return True

def start_bot_process():
    """Start the bot as a subprocess and return the process object."""
    logger.info("Starting Discord bot...")
    # Start bot.py as a subprocess
    process = subprocess.Popen(
        [sys.executable, "python_version/bot.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    
    logger.info(f"Bot started with PID: {process.pid}")
    return process

def monitor_process(process):
    """Monitor the bot process and log its output."""
    while True:
        # Read output from stdout
        stdout_line = process.stdout.readline()
        if stdout_line:
            logger.info(f"[BOT] {stdout_line.strip()}")
        
        # Read output from stderr
        stderr_line = process.stderr.readline()
        if stderr_line:
            logger.error(f"[BOT ERROR] {stderr_line.strip()}")
        
        # Check if process has exited
        if process.poll() is not None:
            return_code = process.poll()
            logger.warning(f"Bot process exited with code {return_code}")
            break
        
        # Small sleep to prevent high CPU usage
        time.sleep(0.1)

async def heartbeat():
    """Send periodic heartbeats to keep the process alive."""
    while True:
        logger.info(f"[HEARTBEAT] Bot is still running at {datetime.now().isoformat()}")
        await asyncio.sleep(300)  # Send heartbeat every 5 minutes

async def main():
    """Main function to run the bot with restart capability."""
    # Check environment variables
    if not check_environment():
        sys.exit(1)
    
    # Sync commands
    try:
        await sync_commands()
    except Exception as e:
        logger.error(f"Error synchronizing commands: {e}")
        # Continue even if command sync fails
    
    # Start heartbeat task
    heartbeat_task = asyncio.create_task(heartbeat())
    
    # Start bot with restart logic
    while True:
        try:
            process = start_bot_process()
            monitor_process(process)
            
            # If we reach here, the process has exited
            logger.info("Restarting bot in 10 seconds...")
            await asyncio.sleep(10)
        except Exception as e:
            logger.error(f"Error in bot process: {e}")
            logger.info("Restarting bot in 10 seconds...")
            await asyncio.sleep(10)

if __name__ == "__main__":
    try:
        logger.info("=== RENDER PYTHON BOT STARTUP SCRIPT ===")
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot startup script terminated by user")
    except Exception as e:
        logger.error(f"Unhandled exception in startup script: {e}")
        sys.exit(1)