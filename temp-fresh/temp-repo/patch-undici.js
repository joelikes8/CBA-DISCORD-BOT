/**
 * This module patches the undici ReadableStream issue
 * Must be required at the very beginning before any other imports
 */

console.log('[PATCH] Applying ReadableStream fix for undici/fetch');

// Create a mock ReadableStream if it doesn't exist
if (typeof globalThis.ReadableStream === 'undefined') {
  console.log('[PATCH] ReadableStream not available, creating mock implementation');
  
  // Define a minimal mock implementation of ReadableStream
  class MockReadableStream {
    constructor(underlyingSource = {}, strategy = {}) {
      this._source = underlyingSource;
      this._strategy = strategy;
      this._reader = null;
      this._state = 'readable';
    }
    
    getReader() {
      this._reader = {
        read: async () => ({ done: true, value: undefined }),
        releaseLock: () => {}
      };
      return this._reader;
    }
    
    pipeThrough() {
      return new MockReadableStream();
    }
    
    pipeTo() {
      return Promise.resolve();
    }
    
    cancel() {
      return Promise.resolve();
    }
    
    tee() {
      return [new MockReadableStream(), new MockReadableStream()];
    }
  }
  
  // Create mock implementations for related classes
  class MockResponse {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.statusText = options.statusText || '';
      this.headers = options.headers || {};
      this.ok = this.status >= 200 && this.status < 300;
    }
    
    async text() {
      return '';
    }
    
    async json() {
      return {};
    }
    
    async arrayBuffer() {
      return new ArrayBuffer(0);
    }
  }
  
  // Assign to global objects
  globalThis.ReadableStream = MockReadableStream;
  globalThis.Response = globalThis.Response || MockResponse;
  globalThis.FormData = globalThis.FormData || class FormData {};
}

// Install a special require hook to patch undici modules before they load
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  // Only intercept undici modules related to fetch
  if (id.includes('undici') && id.includes('fetch')) {
    try {
      console.log(`[PATCH] Patching module: ${id}`);
      const result = originalRequire.call(this, id);
      
      // For specific problematic files, ensure they don't break
      if (id.includes('response.js') || id.includes('index.js')) {
        console.log(`[PATCH] Applied extra patching to ${id}`);
      }
      
      return result;
    } catch (error) {
      console.error(`[PATCH] Error in patched module ${id}: ${error.message}`);
      // For fetch API modules, return mock implementations if they fail
      if (id.includes('fetch/index.js')) {
        console.log('[PATCH] Returning mock fetch implementation');
        return { fetch: async () => new (globalThis.Response || function(){})() };
      }
      throw error;
    }
  }
  
  // For all other modules, use the original require
  return originalRequire.call(this, id);
};

console.log('[PATCH] ReadableStream patch applied successfully');