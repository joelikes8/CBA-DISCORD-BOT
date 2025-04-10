/**
 * Render Bot Starter Script
 * 
 * This script is designed specifically for Render deployment:
 * 1. Deploys slash commands
 * 2. Starts the bot with crash recovery
 * 3. Implements heartbeat mechanism to keep the bot active
 * 
 * NOTE: This is a background worker process and does not expose any HTTP ports.
 * Render should run this as a worker service, not a web service.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== RENDER BOT STARTUP SCRIPT ===');

// Validate environment variables
console.log('Checking environment variables...');
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'APPLICATION_ID',
  'ROBLOX_COOKIE',
  'ROBLOX_GROUP_ID',
  'DATABASE_URL'
];

let missingVars = false;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[ERROR] Missing required environment variable: ${envVar}`);
    missingVars = true;
  } else {
    console.log(`[OK] Found ${envVar}`);
  }
}

if (missingVars) {
  console.error('[FATAL] Missing required environment variables. Exiting.');
  process.exit(1);
}

// Function to deploy commands
async function deployCommands() {
  return new Promise((resolve, reject) => {
    console.log('Deploying slash commands...');
    
    const deployProcess = spawn('node', ['deploy-commands.js']);
    
    deployProcess.stdout.on('data', (data) => {
      console.log(`[DEPLOY] ${data.toString().trim()}`);
    });
    
    deployProcess.stderr.on('data', (data) => {
      console.error(`[DEPLOY ERROR] ${data.toString().trim()}`);
    });
    
    deployProcess.on('close', (code) => {
      if (code === 0) {
        console.log('[DEPLOY] Commands deployed successfully!');
        resolve();
      } else {
        console.error(`[DEPLOY ERROR] Command deployment failed with code ${code}`);
        // Continue even if command deployment fails
        resolve();
      }
    });
  });
}

// Function to start the bot with restart capability
async function startBot() {
  console.log('Starting Discord bot...');
  
  try {
    // Check if the token is valid before starting the bot
    if (!process.env.DISCORD_TOKEN) {
      console.error('[CRITICAL ERROR] DISCORD_TOKEN not set or invalid');
      console.error('[INFO] Please ensure DISCORD_TOKEN is correctly set in environment variables');
      // Don't restart immediately if token is missing - wait longer
      console.log('[BOT] Will attempt restart in 60 seconds...');
      setTimeout(() => {
        startBot();
      }, 60000);
      return;
    }

    // Log more environment details for debugging
    console.log('[DEBUG] Node version:', process.version);
    console.log('[DEBUG] Discord token length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);
    console.log('[DEBUG] Application ID present:', !!process.env.APPLICATION_ID);
    
    const botProcess = spawn('node', ['index.js']);
    
    botProcess.stdout.on('data', (data) => {
      console.log(`[BOT] ${data.toString().trim()}`);
    });
    
    botProcess.stderr.on('data', (data) => {
      console.error(`[BOT ERROR] ${data.toString().trim()}`);
    });
    
    let heartbeatInterval;
    
    botProcess.on('close', (code) => {
      console.log(`[BOT] Process exited with code ${code}`);
      
      // Clear heartbeat interval when process exits
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      if (code === 1) {
        console.error('[BOT CRASH] Bot crashed with exit code 1. This might indicate:');
        console.error('  - Invalid token or permissions');
        console.error('  - Network connectivity issues');
        console.error('  - Discord API rate limiting');
        console.error('  - Uncaught exceptions in the code');
      }
      
      // Restart the bot after a delay
      console.log('[BOT] Restarting in 30 seconds...');
      setTimeout(() => {
        startBot();
      }, 30000); // Increased delay to avoid rapid restarts
    });
    
    // Implement heartbeat mechanism
    heartbeatInterval = setInterval(() => {
      console.log('[HEARTBEAT] Bot is still running at', new Date().toISOString());
    }, 300000); // Log every 5 minutes to keep the process active
    
  } catch (error) {
    console.error('[FATAL ERROR] Error starting bot process:', error);
    console.log('[BOT] Will attempt restart in 60 seconds...');
    setTimeout(() => {
      startBot();
    }, 60000);
  }
}

// Main function
async function main() {
  try {
    // First deploy commands
    await deployCommands();
    
    // Then start the bot
    await startBot();
  } catch (error) {
    console.error('[FATAL ERROR]', error);
    process.exit(1);
  }
}

// Tell Render this is a worker with no HTTP server
console.log('[INFO] This is a background worker service with no HTTP server or open ports');
console.log('[INFO] Render should not expect any port to be bound');

// Execute main function
main();