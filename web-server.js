/**
 * Web Server Wrapper for Discord Bot
 * 
 * This file creates a simple web server to satisfy Render's free tier requirements
 * while running the Discord bot in the background.
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const { validateDiscordToken } = require('./ensure-discord-login');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Log the request URL
  console.log(`[WEB] Request received: ${req.url}`);

  // Simple router based on URL path
  if (req.url === '/health' || req.url === '/healthz') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok',
      service: 'discord-bot',
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/status') {
    // Discord bot status endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // Get bot status information
    const status = {
      discord: {
        token: process.env.DISCORD_TOKEN ? 'configured' : 'missing',
        token_length: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0
      },
      roblox: {
        cookie: process.env.ROBLOX_COOKIE ? 'configured' : 'missing',
        group_id: process.env.ROBLOX_GROUP_ID || 'not set'
      },
      application: {
        id: process.env.APPLICATION_ID ? 'configured' : 'missing'
      },
      database: {
        url: process.env.DATABASE_URL ? 'configured' : 'missing'
      },
      service: {
        port: process.env.PORT || '5000',
        node_version: process.version,
        uptime: Math.floor(process.uptime()) + ' seconds'
      },
      timestamp: new Date().toISOString()
    };
    
    res.end(JSON.stringify(status, null, 2));
  } else if (req.url === '/') {
    // Root endpoint - show basic status page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    // Get bot status information
    const status = {
      discord: {
        token: process.env.DISCORD_TOKEN ? 'configured' : 'missing',
        token_length: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0
      },
      roblox: {
        cookie: process.env.ROBLOX_COOKIE ? 'configured' : 'missing',
        group_id: process.env.ROBLOX_GROUP_ID || 'not set'
      },
      application: {
        id: process.env.APPLICATION_ID ? 'configured' : 'missing'
      },
      database: {
        url: process.env.DATABASE_URL ? 'configured' : 'missing'
      },
      service: {
        port: process.env.PORT || '5000',
        node_version: process.version,
        uptime: Math.floor(process.uptime()) + ' seconds',
        start_time: new Date(Date.now() - (process.uptime() * 1000)).toISOString()
      }
    };
    
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Discord Bot Status</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .status { padding: 15px; border-radius: 5px; margin: 10px 0; }
            .online { background-color: #d4edda; color: #155724; }
            .warning { background-color: #fff3cd; color: #856404; }
            .error { background-color: #f8d7da; color: #721c24; }
            .log { background-color: #f8f9fa; padding: 10px; border-radius: 5px; overflow: auto; max-height: 300px; }
            .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .info-table th { text-align: left; padding: 8px; background-color: #f2f2f2; }
            .info-table td { padding: 8px; border-top: 1px solid #ddd; }
            .configured { color: green; }
            .missing { color: red; }
          </style>
        </head>
        <body>
          <h1>Discord Bot Status</h1>
          
          <div class="status ${status.discord.token === 'configured' ? 'online' : 'error'}">
            <h2>Service Status: ${status.discord.token === 'configured' ? 'Online' : 'Error'}</h2>
            <p>The Discord bot is ${status.discord.token === 'configured' ? 'running in the background' : 'not running due to missing configuration'}.</p>
            <p>Last update: ${new Date().toISOString()}</p>
          </div>
          
          <div>
            <h3>Configuration Status</h3>
            <table class="info-table">
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
              <tr>
                <td>Discord Token</td>
                <td class="${status.discord.token === 'configured' ? 'configured' : 'missing'}">${status.discord.token}</td>
                <td>Length: ${status.discord.token_length} characters</td>
              </tr>
              <tr>
                <td>Application ID</td>
                <td class="${status.application.id === 'configured' ? 'configured' : 'missing'}">${status.application.id}</td>
                <td>Required for slash commands</td>
              </tr>
              <tr>
                <td>Roblox Cookie</td>
                <td class="${status.roblox.cookie === 'configured' ? 'configured' : 'missing'}">${status.roblox.cookie}</td>
                <td>Required for Roblox API access</td>
              </tr>
              <tr>
                <td>Roblox Group ID</td>
                <td>${status.roblox.group_id}</td>
                <td>Configured group ID</td>
              </tr>
              <tr>
                <td>Database</td>
                <td class="${status.database.url === 'configured' ? 'configured' : 'missing'}">${status.database.url}</td>
                <td>PostgreSQL connection</td>
              </tr>
            </table>
          </div>
          
          <div>
            <h3>System Information</h3>
            <table class="info-table">
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>Node.js Version</td>
                <td>${status.service.node_version}</td>
              </tr>
              <tr>
                <td>Service Port</td>
                <td>${status.service.port}</td>
              </tr>
              <tr>
                <td>Uptime</td>
                <td>${status.service.uptime}</td>
              </tr>
              <tr>
                <td>Started At</td>
                <td>${status.service.start_time}</td>
              </tr>
              <tr>
                <td>Status Endpoints</td>
                <td>
                  <a href="/health" target="_blank">/health</a> | 
                  <a href="/status" target="_blank">/status</a>
                </td>
              </tr>
            </table>
          </div>
          
          <div>
            <h3>Service Information</h3>
            <p>This web page is a wrapper for the Discord bot running on Render's free tier.</p>
            <p>The Discord bot is a background process that connects to Discord's API.</p>
            <p><strong>Note:</strong> This service is designed to work with Render's free tier by providing a web interface while running the Discord bot in the background.</p>
          </div>
        </body>
      </html>
    `);
  } else {
    // All other paths - return 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start the HTTP server
const port = process.env.PORT || 5000; // Render sets PORT environment variable
server.listen(port, '0.0.0.0', () => {
  console.log(`[WEB] Server running at http://0.0.0.0:${port}/`);
  console.log('[WEB] Health check available at /health');
  
  // After web server is running, validate Discord token and then start the bot
  validateDiscordToken().then(success => {
    if (success) {
      console.log('[SERVER] Discord token validation successful, starting bot...');
      startDiscordBot();
    } else {
      console.error('[SERVER] Discord token validation failed. Please check your DISCORD_TOKEN environment variable.');
      console.error('[SERVER] The web server will continue running, but the Discord bot will not start.');
    }
  }).catch(error => {
    console.error('[SERVER] Error during Discord token validation:', error);
    console.error('[SERVER] The web server will continue running, but the Discord bot will not start.');
  });
});

// Function to start the Discord bot as a background process
function startDiscordBot() {
  console.log('[BOT] Starting Discord bot in background mode...');
  
  // Use our special direct-fix approach that fixes ReadableStream issues
  const botProcess = spawn('node', ['--require', './direct-undici-fix.js', 'index.js'], {
    stdio: 'pipe', // Capture stdout and stderr
    detached: false, // Keep it attached to this process
    env: {
      ...process.env,
      RENDER: 'true',
      UNDICI_NO_READABLE_STREAM: '1',
      NO_UNDICI_FETCH: '1'
    }
  });
  
  // Log output from the bot process
  botProcess.stdout.on('data', (data) => {
    console.log(`[BOT] ${data.toString().trim()}`);
  });
  
  botProcess.stderr.on('data', (data) => {
    console.error(`[BOT ERROR] ${data.toString().trim()}`);
  });
  
  // Handle bot process exit
  botProcess.on('close', (code) => {
    console.log(`[BOT] Discord bot process exited with code ${code}`);
    
    // If the bot crashes, restart it after a delay
    if (code !== 0) {
      console.log('[BOT] Restarting bot in 30 seconds...');
      setTimeout(startDiscordBot, 30000);
    }
  });
  
  console.log('[BOT] Discord bot started in background mode');
}

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
  });
});

// Catch unhandled errors to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('[SERVER] Uncaught exception:', error);
  // Keep running despite errors
});

console.log('[SERVER] Discord bot web wrapper initialized');