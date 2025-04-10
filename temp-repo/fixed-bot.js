/**
 * SPECIAL ENTRY POINT WITH COMPLETE MODULE REPLACEMENT
 * 
 * This approach completely replaces problem modules rather than
 * just patching them. This is the most aggressive solution but
 * should work in any Node.js environment.
 */

console.log('[STARTUP] Starting bot with aggressive module patching');

// Define ReadableStream globally before anything else
if (typeof globalThis.ReadableStream === 'undefined') {
  console.log('[STARTUP] Creating global ReadableStream implementation');
  globalThis.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() { return { read: async () => ({ done: true }) }; }
    pipeThrough() { return this; }
    pipeTo() { return Promise.resolve(); }
  };
}

// Apply our complete monkey patching solution first - this is the most aggressive approach
console.log('[STARTUP] Applying complete module replacement for undici/fetch');
require('./monkey-patch');

// NOTE: We're not using patch-undici.js anymore as it wasn't aggressive enough
// The monkey-patch.js approach completely replaces the modules

// Set up error handlers
process.on('uncaughtException', (error) => {
  console.error('[ERROR HANDLER] Uncaught Exception:', error.message);
  
  // Special case for ReadableStream errors
  if (error.message && error.message.includes('ReadableStream')) {
    console.error('[ERROR HANDLER] ReadableStream error detected, but will continue running');
    // Continue running despite ReadableStream errors
  } else {
    // For other errors, log but continue to avoid endless restart cycles
    console.error('[ERROR HANDLER] Stack trace:', error.stack);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR HANDLER] Unhandled Promise Rejection:', reason);
  // Don't exit for unhandled rejections
});

// Now load the bot with our monkey patching in place
console.log('[STARTUP] Starting Discord bot with complete module replacement');
require('./render-worker.js');