/**
 * Render Worker Service - NO WEB SERVER
 * 
 * This is a special entry point for Render workers that:
 * 1. Does not bind to any ports
 * 2. Explicitly disables port scanning
 * 3. Runs the Discord bot as a pure background process
 * 4. Provides better error handling and recovery
 * 
 * IMPORTANT: This script must be used as the start command in Render
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');

// Import the port scanning prevention module
const { preventPortScanning } = require('./render-no-port-scan');

// Run all prevention measures to stop port scanning
preventPortScanning();

// Make Render aware this is not a web service by printing these messages
console.log('================== WORKER SERVICE NOTICE ==================');
console.log('THIS IS A BACKGROUND WORKER SERVICE, NOT A WEB SERVICE');
console.log('NO PORT BINDING OR HTTP SERVER WILL BE STARTED');
console.log('RENDER SHOULD NOT EXPECT OR SCAN FOR OPEN PORTS');
console.log('==========================================================');

// Validate environment variables
function validateEnvironment() {
  const requiredVars = [
    'DISCORD_TOKEN',
    'APPLICATION_ID',
    'ROBLOX_COOKIE',
    'ROBLOX_GROUP_ID',
    'DATABASE_URL'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('CRITICAL ERROR: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('Please add these in the Render dashboard under Environment Variables');
    return false;
  }
  
  return true;
}

// Deploy slash commands
async function deployCommands() {
  console.log('Deploying slash commands...');
  
  return new Promise((resolve, reject) => {
    const deployProcess = spawn('node', ['deploy-commands.js']);
    
    deployProcess.stdout.on('data', (data) => {
      console.log(`[DEPLOY] ${data.toString().trim()}`);
    });
    
    deployProcess.stderr.on('data', (data) => {
      console.error(`[DEPLOY ERROR] ${data.toString().trim()}`);
    });
    
    deployProcess.on('close', (code) => {
      if (code === 0) {
        console.log('[DEPLOY] Slash commands deployed successfully');
        resolve();
      } else {
        console.error(`[DEPLOY] Failed to deploy slash commands (exit code ${code})`);
        // Continue even if deploy fails - the bot can still run with existing commands
        resolve();
      }
    });
  });
}

// Start the Discord bot with restart capability
async function startBot() {
  console.log('Starting Discord bot...');
  
  // Create a simple proxy file that handles uncaught exceptions better
  const proxyJs = `
  // This is a temporary proxy file that adds better error handling
  process.on('uncaughtException', (error) => {
    console.error('[FATAL ERROR] Uncaught Exception:', error);
    // Log error but don't exit - parent process will handle restart
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL ERROR] Unhandled Promise Rejection:', reason);
    // Log error but don't exit - parent process will handle restart
    process.exit(1);
  });
  
  // Run the actual bot
  require('./index.js');
  `;
  
  fs.writeFileSync('bot-proxy.js', proxyJs);
  
  const botProcess = spawn('node', ['bot-proxy.js'], {
    env: process.env,
    stdio: 'pipe' // Use pipe instead of inherit to capture output
  });
  
  botProcess.stdout.on('data', (data) => {
    console.log(`[BOT] ${data.toString().trim()}`);
  });
  
  botProcess.stderr.on('data', (data) => {
    console.error(`[BOT ERROR] ${data.toString().trim()}`);
  });
  
  let heartbeatInterval = setInterval(() => {
    console.log('[HEARTBEAT] Worker service is still running:', new Date().toISOString());
    
    // Periodically remind Render this is not a web service
    console.log('[WORKER] This is a background worker with no HTTP server or ports');
  }, 300000); // Every 5 minutes
  
  return new Promise((resolve) => {
    botProcess.on('close', (code) => {
      console.log(`[BOT] Bot process exited with code ${code}`);
      
      clearInterval(heartbeatInterval);
      
      if (code !== 0) {
        console.error('[BOT CRASH] Bot crashed with exit code', code);
        console.error('[RECOVERY] Waiting 30 seconds before restarting...');
        
        // Special handling for invalid token errors
        if (code === 1) {
          // Try to find token errors in logs
          try {
            console.error('[DIAGNOSTIC] Running diagnostic checks...');
            
            // Check if we get a token validation error directly
            try {
              const tokenTest = execSync('node -e "const { Client } = require(\'discord.js\'); const client = new Client({ intents: [] }); client.login(process.env.DISCORD_TOKEN).catch(e => { console.error(e.message); process.exit(2); });"', {
                timeout: 10000,
                env: process.env
              });
            } catch (e) {
              if (e.status === 2) {
                console.error('[TOKEN ERROR] Your Discord token appears to be invalid.');
                console.error('[SOLUTION] Please check your DISCORD_TOKEN in Render environment variables.');
              }
            }
          } catch (e) {
            // Diagnostics failed, just continue with restart
            console.error('[DIAGNOSTIC] Diagnostics failed:', e.message);
          }
        }
        
        setTimeout(() => {
          resolve(false); // Indicate restart needed
        }, 30000);
      } else {
        resolve(true); // Normal exit
      }
    });
  });
}

// Main function
async function main() {
  // Print environment info (without sensitive values)
  console.log('=== Environment Info ===');
  console.log('Node Version:', process.version);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('Current Directory:', process.cwd());
  console.log('Environment Variables Present:');
  Object.keys(process.env)
    .filter(key => !key.includes('TOKEN') && !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('COOKIE'))
    .forEach(key => {
      console.log(`  - ${key}: ${key.includes('URL') ? '[URL HIDDEN]' : 'Present'}`);
    });
  console.log('========================');

  // Validate environment before starting
  if (!validateEnvironment()) {
    console.error('[CRITICAL] Environment validation failed!');
    console.error('[INFO] Bot will wait 60 seconds and retry...');
    
    setTimeout(() => {
      main(); // Retry after delay
    }, 60000);
    
    return;
  }
  
  try {
    // First deploy commands
    await deployCommands();
    
    // Then start the bot in a loop to handle restarts
    let running = true;
    while (running) {
      const success = await startBot();
      if (success) {
        running = false; // Normal exit, don't restart
      } else {
        console.log('[RESTART] Restarting bot...');
        // Continue loop to restart
      }
    }
  } catch (error) {
    console.error('[FATAL ERROR]', error);
    
    console.error('[RECOVERY] Fatal error occurred, restarting in 60 seconds...');
    setTimeout(() => {
      main(); // Retry after fatal error
    }, 60000);
  }
}

// Prevent node from exiting by setting up an interval
const keepAlive = setInterval(() => {
  console.log('[WORKER] Background worker service is still running');
}, 3600000); // Every hour

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] Render worker service shutting down');
  clearInterval(keepAlive);
  process.exit(0);
});

// Execute main function
console.log('[WORKER] Starting Discord bot as background worker...');
main();