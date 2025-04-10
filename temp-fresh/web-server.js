/**
 * Web Server Wrapper for Discord Bot
 * 
 * This file creates a simple web server to satisfy Render's free tier requirements
 * while running the Discord bot in the background.
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

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
  } else if (req.url === '/') {
    // Root endpoint - show basic status page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Discord Bot Status</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .status { padding: 15px; border-radius: 5px; margin: 10px 0; }
            .online { background-color: #d4edda; color: #155724; }
            .log { background-color: #f8f9fa; padding: 10px; border-radius: 5px; overflow: auto; max-height: 300px; }
          </style>
        </head>
        <body>
          <h1>Discord Bot Status</h1>
          <div class="status online">
            <h2>Service Status: Online</h2>
            <p>The Discord bot is running in the background.</p>
            <p>Last update: ${new Date().toISOString()}</p>
          </div>
          <div>
            <h3>Service Information</h3>
            <p>This web page is a wrapper for the Discord bot running on Render.</p>
            <p>The Discord bot is a background process that connects to Discord's API.</p>
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
  
  // After web server is running, start the Discord bot
  startDiscordBot();
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