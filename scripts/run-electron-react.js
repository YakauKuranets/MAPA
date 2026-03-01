#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const runUiScript = path.join(__dirname, 'run-electron-ui.js');

const child = spawn(process.execPath, [runUiScript, 'react'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
