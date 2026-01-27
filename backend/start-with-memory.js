#!/usr/bin/env node

// Start the server with increased memory allocation
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting MEDIBOT server with increased memory allocation...');

const serverProcess = spawn('node', [
  '--max-old-space-size=8192',  // 8GB memory limit
  '--expose-gc',                // Enable garbage collection
  'server.js'
], {
  stdio: 'inherit',
  cwd: __dirname
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
});