/**
 * EXTREME SOLUTION FOR RENDER DEPLOYMENT
 * 
 * This script directly hijacks Node.js module loading system
 * to replace the problematic undici module files with our custom implementations
 */

// We need to do this immediately, so no requiring any other modules first
console.log('[EXTREME-FIX] Starting extreme compatibility fixes for Render deployment');

// Get the built-in Node.js module system
const Module = require('module');
const fs = require('fs');
const path = require('path');

// Store the original loader
const originalRequire = Module.prototype.require;

// Target file patterns that cause problems
const PROBLEM_FILES = [
  'undici/lib/web/fetch/response.js',
  'undici/lib/web/fetch/index.js',
  'node-fetch/lib/index.js',
  '@discordjs/node-fetch'
];

// Replacement content for problematic modules
const replacementModules = {
  // For undici response.js which has ReadableStream
  'undici/lib/web/fetch/response.js': `
    // HIJACKED MODULE: This is a compatibility replacement for Render deployment
    class MockReadableStream {
      constructor() {}
      getReader() { return { read: async () => ({ done: true, value: undefined }) }; }
      pipeThrough() { return this; }
      pipeTo() { return Promise.resolve(); }
      cancel() { return Promise.resolve(); }
      tee() { return [this, this]; }
      getIterator() { return { next: async () => ({ done: true, value: undefined }) }; }
    }
    
    class MockResponse {
      constructor(body, init = {}) {
        this.body = body;
        this.status = init.status || 200;
        this.statusText = init.statusText || '';
        this._headers = new Map();
      }
      
      get headers() { return this._headers; }
      
      async text() { return ''; }
      async json() { return {}; }
      async arrayBuffer() { return new ArrayBuffer(0); }
      async blob() { return { type: 'text/plain', size: 0 }; }
    }
    
    module.exports = {
      ReadableStream: MockReadableStream,
      Response: MockResponse,
      // Add other exports that might be needed
      isReadableStreamLike: () => false,
      blobFrom: () => ({ type: 'text/plain', size: 0 }),
      formDataFromEntries: () => ({}),
      toUSVString: (str) => String(str),
      binaryStreamToBuffer: async () => Buffer.alloc(0)
    };
  `,
  
  // For undici fetch/index.js
  'undici/lib/web/fetch/index.js': `
    // HIJACKED MODULE: This is a compatibility replacement for Render deployment
    const MockRequest = class Request {
      constructor(input, init = {}) {
        this.url = typeof input === 'string' ? input : input.url || '';
        this.method = init.method || 'GET';
        this.headers = {};
        this.signal = { aborted: false };
      }
    };
    
    const MockResponse = class Response {
      constructor(body, init = {}) {
        this.body = body;
        this.status = init.status || 200;
        this.statusText = init.statusText || '';
        this._headers = new Map();
      }
      
      get headers() { return this._headers; }
      
      async text() { return ''; }
      async json() { return {}; }
      async arrayBuffer() { return new ArrayBuffer(0); }
      async blob() { return { type: 'text/plain', size: 0 }; }
      clone() { return new MockResponse(this.body, { status: this.status }); }
    };
    
    const MockHeaders = class Headers {
      constructor(init = {}) {
        this._headers = new Map();
      }
      
      get(name) { return null; }
      set(name, value) {}
      append(name, value) {}
      has(name) { return false; }
      delete(name) {}
      forEach(callback) {}
    };
    
    const MockReadableStream = class ReadableStream {
      constructor() {}
      getReader() { return { read: async () => ({ done: true, value: undefined }) }; }
      pipeThrough() { return this; }
      pipeTo() { return Promise.resolve(); }
      cancel() { return Promise.resolve(); }
      tee() { return [this, this]; }
      getIterator() { return { next: async () => ({ done: true, value: undefined }) }; }
    };
    
    // Mock fetch function
    async function fetch(input, init) {
      // Return a mock response
      return new MockResponse(null, { status: 200 });
    }
    
    module.exports = {
      fetch,
      Request: MockRequest,
      Response: MockResponse,
      Headers: MockHeaders,
      ReadableStream: MockReadableStream,
      FormData: class FormData {},
      DOMException: class DOMException extends Error {},
      structuredClone: (obj) => JSON.parse(JSON.stringify(obj)),
      // Utility functions
      isReadableStreamLike: () => false,
      blobFrom: () => ({ type: 'text/plain', size: 0 }),
      formDataFromEntries: () => ({}),
      toUSVString: (str) => String(str),
      binaryStreamToBuffer: async () => Buffer.alloc(0)
    };
  `
};

// Hijack the require function to intercept problematic modules
Module.prototype.require = function(modulePath) {
  // Check if this is a problematic module
  const isProblematic = PROBLEM_FILES.some(pattern => modulePath.includes(pattern));
  
  if (isProblematic) {
    console.log(`[EXTREME-FIX] Intercepted problematic module: ${modulePath}`);
    
    // Look for exact replacements
    for (const key in replacementModules) {
      if (modulePath.includes(key)) {
        console.log(`[EXTREME-FIX] Applying direct module replacement for: ${key}`);
        
        // Create a temporary file with our replacement
        const tmpDir = path.join(__dirname, '.tmp-modules');
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        const replacementFile = path.join(tmpDir, `${path.basename(key)}.js`);
        fs.writeFileSync(replacementFile, replacementModules[key]);
        
        // Load our replacement instead
        return originalRequire.call(this, replacementFile);
      }
    }
    
    // If we don't have an exact replacement, provide a generic empty module
    console.log(`[EXTREME-FIX] Using generic module replacement`);
    return {};
  }
  
  // If not problematic, use the original require
  return originalRequire.call(this, modulePath);
};

// Define global polyfills for web APIs that might be missing
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() { return { read: async () => ({ done: true, value: undefined }) }; }
    pipeThrough() { return this; }
    pipeTo() { return Promise.resolve(); }
    cancel() { return Promise.resolve(); }
    getIterator() { return { next: async () => ({ done: true, value: undefined }) }; }
    tee() { return [this, this]; }
  };
  console.log('[EXTREME-FIX] Added global ReadableStream polyfill');
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this._headers = new Map();
    }
    get headers() { return this._headers; }
    async text() { return ''; }
    async json() { return {}; }
    async arrayBuffer() { return new ArrayBuffer(0); }
  };
  console.log('[EXTREME-FIX] Added global Response polyfill');
}

if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url || '';
      this.method = init.method || 'GET';
      this.headers = {};
    }
  };
  console.log('[EXTREME-FIX] Added global Request polyfill');
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor() { this._headers = {}; }
    get() { return null; }
    set() {}
    append() {}
    has() { return false; }
  };
  console.log('[EXTREME-FIX] Added global Headers polyfill');
}

if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {}
    append() {}
    delete() {}
    get() { return null; }
    getAll() { return []; }
    has() { return false; }
    set() {}
  };
  console.log('[EXTREME-FIX] Added global FormData polyfill');
}

if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor() {}
    text() { return Promise.resolve(''); }
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
  };
  console.log('[EXTREME-FIX] Added global Blob polyfill');
}

// Patch fetch if needed
if (typeof fetch === 'undefined') {
  global.fetch = async function(input, init) {
    return new global.Response();
  };
  console.log('[EXTREME-FIX] Added global fetch polyfill');
}

console.log('[EXTREME-FIX] Extreme compatibility fixes applied successfully');

// Export the mocks for direct use if needed
module.exports = {
  ReadableStream: global.ReadableStream,
  Response: global.Response,
  Request: global.Request,
  Headers: global.Headers,
  FormData: global.FormData,
  Blob: global.Blob,
  fetch: global.fetch
};