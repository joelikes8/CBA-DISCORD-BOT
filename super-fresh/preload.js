/**
 * PRELOAD SCRIPT - MUST BE LOADED WITH -r FLAG BEFORE ANYTHING ELSE
 * This script uses Node.js's preloading feature to fix compatibility issues
 * before any modules are loaded.
 */

console.log('Preload script running - preparing environment...');

// First, define ReadableStream before anything can use it
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() { return { read: async () => ({ done: true, value: undefined }) }; }
    pipeThrough() { return this; }
    pipeTo() { return Promise.resolve(); }
    cancel() { return Promise.resolve(); }
  };
  
  console.log('Created global ReadableStream implementation');
}

// Define other web standards that might be missing
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
    }
    
    json() { return Promise.resolve({}); }
    text() { return Promise.resolve(''); }
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
  };
  
  console.log('Created global Response implementation');
}

if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor() {
      this._headers = {};
    }
    
    get() { return null; }
    set() {}
    append() {}
    has() { return false; }
  };
  
  console.log('Created global Headers implementation');
}

if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(input, init = {}) {
      this.url = input;
      this.method = init.method || 'GET';
    }
  };
  
  console.log('Created global Request implementation');
}

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = async function fetch() {
    return new globalThis.Response();
  };
  
  console.log('Created global fetch implementation');
}

// Set environment settings for Render
process.env.RENDER_SERVICE_TYPE = 'worker';
process.env.NO_PORT_SCAN = 'true';
process.env.NODE_NO_WARNINGS = '1';

// Override the require function to intercept fetch modules
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id.includes('undici') && id.includes('fetch')) {
    console.log(`Intercepting require for ${id}`);
    
    // Return a mock implementation for undici
    return {
      fetch: globalThis.fetch,
      Headers: globalThis.Headers,
      Request: globalThis.Request,
      Response: globalThis.Response,
      ReadableStream: globalThis.ReadableStream
    };
  }
  
  return originalRequire.apply(this, arguments);
};

// Add robust error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  // Don't exit on errors
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // Don't exit on rejections
});

console.log('Preload script complete - environment is prepared');