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

# Create special environment for optimal compatibility
echo "======================================================"
echo "APPLYING COMPLETE MODULE REPLACEMENT FOR COMPATIBILITY"
echo "This will replace problematic modules with working ones"
echo "======================================================"

# Create .node-redefines file to prevent startup checks
echo "ReadableStream,fetch,FormData" > .node-redefines

# Set compatibility environment variables
export NODE_NO_WARNINGS=1
# Don't use NODE_OPTIONS which sometimes causes errors on Render

# Create special undici bypass settings
export UNDICI_NO_READABLE_STREAM=1
export NO_UNDICI_FETCH=1

# Try multiple startup methods to ensure one works

echo "===== DIRECT RENDER FIX ====="
echo "Running direct render fix with special startup file"

# Method 1: Use our new super-aggressive render-start.js
node render-start.js

# If that fails, try the preload approach
if [ $? -ne 0 ]; then
  echo "===== PRELOAD APPROACH ====="
  echo "First approach failed, trying node with preload"
  node -r ./preload.js index.js
fi

# If that also fails, use fixed-bot as last resort
if [ $? -ne 0 ]; then
  echo "===== FIXED BOT APPROACH ====="
  echo "Second approach failed, trying fixed-bot directly"
  node fixed-bot.js
fi