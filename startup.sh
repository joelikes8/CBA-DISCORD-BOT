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

# Start the bot with Node.js flags to fix compatibility issues
NODE_OPTIONS="--no-experimental-fetch --no-experimental-global-fetch" node render-worker.js