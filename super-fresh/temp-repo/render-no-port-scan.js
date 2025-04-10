/**
 * Special module to help Render understand this is not a web service
 * This file creates techniques to prevent port scanning messages
 */

const fs = require('fs');
const path = require('path');

// Create marker files that signal to Render this is a worker
function createWorkerMarkers() {
  // Create a .render-worker file in the root directory
  fs.writeFileSync('.render-worker', 'This is a background worker service with no HTTP ports');
  
  // Create a .render-no-port-scan file
  fs.writeFileSync('.render-no-port-scan', 'Please do not scan for ports in this worker service');
  
  // Create a .render-no-web-service file
  fs.writeFileSync('.render-no-web-service', 'This is not a web service and has no HTTP ports');
  
  console.log('[RENDER] Created worker marker files to prevent port scanning');
}

// Create a tmp directory file that Render checks
function createTempMarkerFiles() {
  try {
    const tmpPath = path.join(process.cwd(), 'tmp');
    
    // Create tmp directory if it doesn't exist
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }
    
    // Create marker files in tmp directory
    fs.writeFileSync(path.join(tmpPath, '.worker-service'), 'worker');
    fs.writeFileSync(path.join(tmpPath, '.no-port-scan'), 'true');
    
    console.log('[RENDER] Created temporary marker files in tmp directory');
  } catch (error) {
    console.error('[RENDER] Error creating tmp marker files:', error.message);
  }
}

// Configure environment to signal this is a worker
function configureWorkerEnvironment() {
  // Set environment variables that Render might check
  process.env.RENDER_SERVICE_TYPE = 'worker';
  process.env.PORT = '-1'; // Invalid port to prevent binding attempts
  process.env.NO_PORT_SCAN = 'true';
  process.env.WORKER_SERVICE = 'true';
  
  console.log('[RENDER] Set environment variables to indicate worker service');
}

// Run all prevention measures
function preventPortScanning() {
  console.log('\n============= RENDER WORKER SERVICE =============');
  console.log('THIS IS A BACKGROUND WORKER SERVICE, NOT A WEB SERVICE');
  console.log('NO PORT BINDING OR HTTP SERVER WILL BE STARTED');
  console.log('RENDER SHOULD NOT SCAN FOR OPEN PORTS');
  console.log('=================================================\n');
  
  createWorkerMarkers();
  createTempMarkerFiles();
  configureWorkerEnvironment();
  
  console.log('[RENDER] Completed port scanning prevention measures');
  console.log('\n=================================================\n');
  
  return true;
}

module.exports = {
  preventPortScanning
};