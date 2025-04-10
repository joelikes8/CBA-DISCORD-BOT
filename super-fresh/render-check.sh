#!/bin/bash

# This script checks if all prerequisites are met for Render deployment

echo "==== CBA Discord Bot - Render Deployment Check ===="
echo "Checking for required files..."

# Check for essential files
REQUIRED_FILES=(
  "startup.sh"
  "render-worker.js"
  "fixed-bot.js"
  "monkey-patch.js"
  "preload.js"
  "index.js"
  "deploy-commands.js"
  "render.yaml"
)

ALL_FILES_PRESENT=true

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file found"
  else
    echo "✗ $file is missing"
    ALL_FILES_PRESENT=false
  fi
done

echo ""
echo "Checking for execute permissions..."

# Check if startup.sh is executable
if [ -x "startup.sh" ]; then
  echo "✓ startup.sh is executable"
else
  echo "✗ startup.sh is not executable (will be fixed during deployment)"
fi

echo ""
echo "Checking for required environment variables..."

# Check for environment variables (without printing values)
ENV_VARS=(
  "DISCORD_TOKEN"
  "APPLICATION_ID"
  "ROBLOX_COOKIE"
  "ROBLOX_GROUP_ID"
  "DATABASE_URL"
)

ALL_ENV_VARS_PRESENT=true

for var in "${ENV_VARS[@]}"; do
  if [ -n "${!var}" ]; then
    echo "✓ $var is set"
  else
    echo "✗ $var is not set"
    ALL_ENV_VARS_PRESENT=false
  fi
done

echo ""
echo "==== Result ===="

# Final check result
if [ "$ALL_FILES_PRESENT" = true ] && [ "$ALL_ENV_VARS_PRESENT" = true ]; then
  echo "✓ All checks passed! Your project is ready for Render deployment."
  echo "  Use the deployment guide in RENDER_DEPLOYMENT.md to deploy."
else
  echo "✗ Some checks failed. Please fix the issues before deploying to Render."
fi

echo ""
echo "To deploy, follow the instructions in RENDER_DEPLOYMENT.md"