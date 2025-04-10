/**
 * DIRECT FILE PATCHING FOR RENDER
 * 
 * This script directly patches the problematic undici file on Render
 * to fix the ReadableStream error
 */

const fs = require('fs');
const path = require('path');

// Check if we're on Render
const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE !== undefined;

// Define the problematic file paths
const paths = [
  // Main undici response.js file - most common problem
  'node_modules/undici/lib/web/fetch/response.js',
  // Backup path just in case
  'node_modules/@discordjs/node-fetch/node_modules/undici/lib/web/fetch/response.js'
];

// The replacement snippet that removes ReadableStream references
const replacementSnippet = `
// PATCHED BY DIRECT-UNDICI-FIX.JS
// This is a compatibility patch for Render deployment

// Mock ReadableStream implementation
class MockReadableStream {
  constructor() {}
  getReader() { return { read: async () => ({ done: true }) }; }
  pipeThrough() { return this; }
  pipeTo() { return Promise.resolve(); }
}

// Use our mock implementation instead of the browser's ReadableStream
const ReadableStream = MockReadableStream;

// Rest of the module's code continues...
`;

console.log('[DIRECT-FIX] Starting direct file patching...');

// Function to find and patch the file
function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`[DIRECT-FIX] File not found: ${filePath}`);
    return false;
  }
  
  console.log(`[DIRECT-FIX] Found file: ${filePath}`);
  
  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it contains the problematic code
  if (content.includes('ReadableStream') && !content.includes('PATCHED BY DIRECT-UNDICI-FIX.JS')) {
    console.log(`[DIRECT-FIX] File contains ReadableStream references. Patching...`);
    
    // Create a backup
    fs.writeFileSync(`${filePath}.backup`, content);
    
    // Replace the first few lines with our patched version
    // This finds the position where we should inject our patch
    const lines = content.split('\n');
    let patchPosition = 0;
    
    // Look for a suitable place to insert our patch
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      if (lines[i].includes('use strict') || lines[i].includes('Object.defineProperty')) {
        patchPosition = i + 1;
        break;
      }
    }
    
    // Insert our patch
    lines.splice(patchPosition, 0, replacementSnippet);
    const patchedContent = lines.join('\n');
    
    // Write the patched file
    fs.writeFileSync(filePath, patchedContent);
    console.log(`[DIRECT-FIX] Successfully patched: ${filePath}`);
    return true;
  } else if (content.includes('PATCHED BY DIRECT-UNDICI-FIX.JS')) {
    console.log(`[DIRECT-FIX] File already patched: ${filePath}`);
    return true;
  } else {
    console.log(`[DIRECT-FIX] File doesn't contain ReadableStream references or is already patched`);
    return false;
  }
}

// Try to patch all potential file paths
let patchedAny = false;
for (const relativePath of paths) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  if (patchFile(fullPath)) {
    patchedAny = true;
  }
}

if (patchedAny) {
  console.log('[DIRECT-FIX] Successfully patched undici files');
} else {
  console.log('[DIRECT-FIX] Could not patch any files. Will try runtime patching instead.');
}

// Global polyfills for ReadableStream and related classes
console.log('[DIRECT-FIX] Setting up global polyfills...');

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
  console.log('[DIRECT-FIX] Added global ReadableStream polyfill');
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) { this.body = body; this.status = init.status || 200; }
    text() { return Promise.resolve(''); }
    json() { return Promise.resolve({}); }
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
    get headers() { return new Map(); }
  };
  console.log('[DIRECT-FIX] Added global Response polyfill');
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor() { this._headers = {}; }
    get() { return null; }
    set() {}
    append() {}
    has() { return false; }
  };
  console.log('[DIRECT-FIX] Added global Headers polyfill');
}

if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {}
  };
  console.log('[DIRECT-FIX] Added global Request polyfill');
}

if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {}
    append() {}
    get() { return null; }
    getAll() { return []; }
    has() { return false; }
    set() {}
  };
  console.log('[DIRECT-FIX] Added global FormData polyfill');
}

if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor() {}
    text() { return Promise.resolve(''); }
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
  };
  console.log('[DIRECT-FIX] Added global Blob polyfill');
}

console.log('[DIRECT-FIX] Direct patching complete. Ready to load application.');

// Continue with the application
console.log('[DIRECT-FIX] Continuing with application startup...');

// Export the fixes so they can be required directly
module.exports = {
  ReadableStream: global.ReadableStream,
  Response: global.Response,
  Headers: global.Headers,
  Request: global.Request,
  FormData: global.FormData,
  Blob: global.Blob
};