#!/bin/bash

# This is a special startup script for Render that prevents port scanning
# and handles Node.js compatibility issues

# Create marker files to prevent port scanning
echo "WORKER_SERVICE=true" > .env.render
echo "This is not a web service" > .render-no-web-service
echo "Do not scan for ports" > .render-no-port-scan

# Set environment variables to prevent port scanning
export RENDER_SERVICE_TYPE="worker"
export PORT="-1"
export NO_PORT_BIND="true"
export NO_PORT_SCAN="true"

# Print clear message that this is not a web service
echo ""
echo "======================= WORKER SERVICE NOTICE ======================="
echo "THIS IS A BACKGROUND WORKER SERVICE WITH NO HTTP SERVER"
echo "NO PORT BINDING WILL OCCUR - DO NOT SCAN FOR PORTS"
echo "=================================================================="
echo ""

# Create simplified proxy script to avoid undici/fetch issues
cat > fix-stream.js << EOL
// This script creates a proxy to avoid ReadableStream issues
process.env.NODE_NO_WARNINGS = '1';

// Override global fetch if it's causing problems
if (typeof globalThis.fetch === 'function') {
  try {
    // Only use if it doesn't cause errors
    const test = new globalThis.ReadableStream();
  } catch (e) {
    // Disable global fetch if ReadableStream is not defined
    console.log('[FIX] Disabling problematic fetch API');
    delete globalThis.fetch;
    delete globalThis.ReadableStream;
    delete globalThis.FormData;
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[FATAL ERROR] Uncaught Exception:', error);
  // Continue running despite errors
  if (error.message && error.message.includes('ReadableStream')) {
    console.error('[FIX] ReadableStream error detected - continuing anyway');
  } else {
    process.exit(1);
  }
});

// Load the actual bot
require('./render-worker.js');
EOL

# Start the bot with simplified fixes
node fix-stream.js