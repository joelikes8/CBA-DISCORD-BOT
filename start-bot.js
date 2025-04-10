/**
 * Render Bot Starter Script
 * 
 * This script is designed specifically for Render deployment:
 * 1. Deploys slash commands
 * 2. Starts the bot with crash recovery
 * 3. Implements heartbeat mechanism to keep the bot active
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
  
  const botProcess = spawn('node', ['index.js']);
  
  botProcess.stdout.on('data', (data) => {
    console.log(`[BOT] ${data.toString().trim()}`);
  });
  
  botProcess.stderr.on('data', (data) => {
    console.error(`[BOT ERROR] ${data.toString().trim()}`);
  });
  
  botProcess.on('close', (code) => {
    console.log(`[BOT] Process exited with code ${code}`);
    
    // Restart the bot after a delay
    console.log('[BOT] Restarting in 10 seconds...');
    setTimeout(() => {
      startBot();
    }, 10000);
  });
  
  // Implement heartbeat mechanism
  setInterval(() => {
    console.log('[HEARTBEAT] Bot is still running');
  }, 300000); // Log every 5 minutes to keep the process active
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

// Execute main function
main();