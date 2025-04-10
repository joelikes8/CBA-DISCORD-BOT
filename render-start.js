/**
 * SPECIAL RENDER STARTUP FILE
 * This fixes the ReadableStream issue directly
 */

// 1. Define ReadableStream globally before anything loads
global.ReadableStream = class ReadableStream {
  constructor() {}
  getReader() { return { read: async () => ({ done: true, value: undefined }) }; }
  pipeThrough() { return this; }
  pipeTo() { return Promise.resolve(); }
  cancel() { return Promise.resolve(); }
  getIterator() { return { next: async () => ({ done: true, value: undefined }) }; }
  tee() { return [this, this]; }
};

// 2. Define other required web APIs
global.Response = class Response {
  constructor(body, init = {}) { this.body = body; this.status = init.status || 200; }
  text() { return Promise.resolve(''); }
  json() { return Promise.resolve({}); }
  arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
  get headers() { return new Map(); }
};

global.Headers = class Headers {
  constructor() { this._headers = {}; }
  get() { return null; }
  set() {}
  append() {}
  has() { return false; }
};

global.Request = class Request {
  constructor(input, init = {}) {}
};

global.FormData = class FormData {
  constructor() {}
  append() {}
  get() { return null; }
  getAll() { return []; }
  has() { return false; }
  set() {}
};

global.Blob = class Blob {
  constructor() {}
  text() { return Promise.resolve(''); }
  arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
};

// 3. Load the normal bot code
console.log('[RENDER] Starting bot with aggressive fixes for ReadableStream issue');
require('./fixed-bot.js');