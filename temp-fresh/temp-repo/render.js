/**
 * RENDER COMPATIBILITY SCRIPT
 * 
 * This is a special script designed specifically for Render's environment.
 * It must be the entry point for your service to prevent ReadableStream errors.
 */

// Disable warnings from Node
process.env.NODE_NO_WARNINGS = '1';

// This must happen before any other imports
// Create the ReadableStream class globally
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() { return { read: async () => ({ done: true }) }; }
    pipeThrough() { return this; }
    pipeTo() { return Promise.resolve(); }
  };
  
  console.log('Created global ReadableStream implementation');
}

// Handle all errors, but don't exit
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  // Don't exit the process
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // Don't exit the process
});

// Now run the bot - try to avoid requiring any other modules before this point
require('./index.js');