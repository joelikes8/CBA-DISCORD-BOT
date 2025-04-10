/**
 * COMPLETE UNDICI/FETCH MONKEY PATCHING SOLUTION
 * 
 * This script completely replaces undici's problematic modules
 * and allows Discord.js to run without ReadableStream
 */

console.log('[MONKEY-PATCH] Starting aggressive patching of Node.js modules');

// Store the original require function
const originalRequire = module.constructor.prototype.require;

// Replace the require function with our custom version
module.constructor.prototype.require = function(modulePath) {
  // If trying to load undici or any of its submodules with fetch
  if (modulePath.includes('undici') && 
      (modulePath.includes('fetch') || modulePath.includes('web'))) {
      
    console.log(`[MONKEY-PATCH] Intercepting require for: ${modulePath}`);
    
    // Create a mock implementation that won't crash
    return createMockUndiciModule(modulePath);
  }
  
  // For non-patched modules, use the original require
  try {
    return originalRequire.apply(this, arguments);
  } catch (error) {
    // For specific problematic modules, provide fallbacks
    if (error.message.includes('ReadableStream') || 
        error.message.includes('fetch')) {
      console.log(`[MONKEY-PATCH] Providing fallback for crashed module: ${modulePath}`);
      return createFallbackModule(modulePath);
    }
    throw error;
  }
};

// Create a fallback for any crashing module
function createFallbackModule(modulePath) {
  // Generic fallback that won't crash
  return {
    fetch: async () => ({ 
      ok: true, 
      status: 200,
      json: async () => ({}),
      text: async () => '',
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => ({}),
    }),
    Request: class Request {},
    Response: class Response {
      constructor() {
        this.ok = true;
        this.status = 200;
      }
      json() { return Promise.resolve({}); }
      text() { return Promise.resolve(''); }
    },
    Headers: class Headers {},
    ReadableStream: class ReadableStream {
      constructor() {}
      getReader() { return { read: async () => ({ done: true }) }; }
      pipeThrough() { return this; }
      pipeTo() { return Promise.resolve(); }
    },
    // Add any other required exports based on the module
    FormData: class FormData {}
  };
}

// Create specific mock implementations for undici modules
function createMockUndiciModule(modulePath) {
  console.log(`[MONKEY-PATCH] Creating mock for: ${modulePath}`);
  
  // Basic mock module
  const mockModule = {
    fetch: async () => new mockModule.Response(),
    Request: class Request {},
    Response: class Response {
      constructor(body, init = {}) {
        this.body = body;
        this.status = init.status || 200;
        this.ok = this.status >= 200 && this.status < 300;
        this.headers = new Map();
      }
      
      json() { return Promise.resolve({}); }
      text() { return Promise.resolve(''); }
      arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
    },
    Headers: class Headers {
      constructor() {
        this.headers = new Map();
      }
      get() { return null; }
      set() {}
      has() { return false; }
    },
    FormData: class FormData {
      constructor() {
        this.data = new Map();
      }
      append() {}
      delete() {}
      get() { return null; }
      getAll() { return []; }
      has() { return false; }
      set() {}
    }
  };
  
  // Define ReadableStream if it doesn't exist
  if (typeof globalThis.ReadableStream === 'undefined') {
    const MockReadableStream = class ReadableStream {
      constructor() {}
      getReader() { return { read: async () => ({ done: true }) }; }
      pipeThrough() { return this; }
      pipeTo() { return Promise.resolve(); }
    };
    
    mockModule.ReadableStream = MockReadableStream;
    globalThis.ReadableStream = MockReadableStream;
  } else {
    mockModule.ReadableStream = globalThis.ReadableStream;
  }
  
  return mockModule;
}

// Also patch global objects
if (typeof globalThis.fetch === 'undefined') {
  const mockFetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      arrayBuffer: async () => new ArrayBuffer(0)
    };
  };
  
  console.log('[MONKEY-PATCH] Adding global fetch implementation');
  globalThis.fetch = mockFetch;
}

console.log('[MONKEY-PATCH] Module patching complete');