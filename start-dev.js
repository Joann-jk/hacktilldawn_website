#!/usr/bin/env node

/**
 * Development server startup script
 * Starts both frontend (Vite) and backend (Node.js) servers
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting HackTillDawn Development Servers...\n');

// Start backend server
console.log('📡 Starting backend server on port 3001...');
const backend = spawn('node', ['local-server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

backend.stdout.on('data', (data) => {
  console.log(`[BACKEND] ${data.toString().trim()}`);
});

backend.stderr.on('data', (data) => {
  console.error(`[BACKEND ERROR] ${data.toString().trim()}`);
});

// Start frontend server
console.log('🎨 Starting frontend server on port 5173...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'pipe'
});

frontend.stdout.on('data', (data) => {
  console.log(`[FRONTEND] ${data.toString().trim()}`);
});

frontend.stderr.on('data', (data) => {
  console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

console.log('\n✅ Both servers are starting up...');
console.log('🌐 Frontend: http://localhost:5173');
console.log('🔧 Backend API: http://localhost:3001');
console.log('❤️  Health Check: http://localhost:3001/api/health');
console.log('\nPress Ctrl+C to stop both servers');
