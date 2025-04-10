/**
 * Special entry point that fixes ReadableStream errors
 * by patching undici/fetch before loading anything else
 */

// Apply the ReadableStream patch first
require('./patch-undici');

// Set up error handlers
process.on('uncaughtException', (error) => {
  console.error('[ERROR HANDLER] Uncaught Exception:', error.message);
  
  // Special case for ReadableStream errors
  if (error.message && error.message.includes('ReadableStream')) {
    console.error('[ERROR HANDLER] ReadableStream error detected - continuing anyway');
  } else {
    // For other errors, log details but continue
    console.error('[ERROR HANDLER] Stack trace:', error.stack);
    // Don't exit immediately to allow Render to log the error
    setTimeout(() => process.exit(1), 1000);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR HANDLER] Unhandled Promise Rejection:', reason);
  // Don't exit for unhandled rejections
});

// Now load the bot
console.log('[STARTUP] Starting bot with ReadableStream patches applied');
require('./render-worker.js');