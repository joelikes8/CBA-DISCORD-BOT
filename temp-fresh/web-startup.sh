#!/bin/bash

# Web Service Version of Startup Script
# This script prepares and starts the Discord bot using a web wrapper
# for compatibility with Render's free tier (Web Service)

# Set up environment for ReadableStream compatibility
echo "======================================================"
echo "   PREPARING DISCORD BOT FOR RENDER WEB SERVICE"
echo "======================================================"

# Create .node-redefines file to prevent startup checks
echo "ReadableStream,fetch,FormData" > .node-redefines

# Set compatibility environment variables
export NODE_NO_WARNINGS=1
export UNDICI_NO_READABLE_STREAM=1
export NO_UNDICI_FETCH=1
export RENDER=true

# Apply direct fixes to undici module
echo ""
echo "======================= DIRECT FIX ======================="
echo "APPLYING DIRECT FIXES TO UNDICI MODULE"
echo "This will patch the problematic files directly"
echo "==========================================================="
echo ""

# Run the direct fix script
node direct-undici-fix.js

# Print information about ports
echo ""
echo "======================= PORT NOTICE ======================="
echo "STARTING WEB SERVER ON PORT $PORT"
echo "This is required for Render free tier compatibility"
echo "==========================================================="
echo ""

# Start the web server wrapper which will run the Discord bot in the background
echo "Starting Discord bot with web server wrapper..."
NODE_OPTIONS="--require ./direct-undici-fix.js" node web-server.js