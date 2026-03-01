#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const electronCli = path.join(__dirname, '..', 'node_modules', 'electron', 'cli.js');
const projectRoot = path.join(__dirname, '..');

const mode = String(process.argv[2] || process.env.PLAYE_UI || 'auto').toLowerCase();
const allowed = new Set(['legacy', 'react', 'auto']);
const resolvedMode = allowed.has(mode) ? mode : 'auto';

const env = {
  ...process.env,
  PLAYE_UI: resolvedMode,
};

if ((resolvedMode === 'react' || resolvedMode === 'auto') && !env.REACT_DEV_SERVER_URL) {
  env.REACT_DEV_SERVER_URL = 'http://127.0.0.1:5173';
}

process.stdout.write(`[run-electron-ui] mode=${resolvedMode}\n`);
if (env.REACT_DEV_SERVER_URL) {
  process.stdout.write(`[run-electron-ui] REACT_DEV_SERVER_URL=${env.REACT_DEV_SERVER_URL}\n`);
}

const child = spawn(process.execPath, [electronCli, '.', '--dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
