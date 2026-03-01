#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const preloadPath = path.join(root, 'preload.js');
const adapterPath = path.join(root, 'frontend-react', 'src', 'electron', 'adapter.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function collectExposedMethodsFromPreload(source) {
  const exposeMatch = source.match(/contextBridge\.exposeInMainWorld\(\s*['"]electronAPI['"],\s*\{([\s\S]*?)\}\s*\)/m);
  assert(exposeMatch, 'Unable to parse electronAPI exposure from preload.js');

  return [...exposeMatch[1].matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)].map((m) => m[1]);
}

function collectFallbackMethodsFromAdapter(source) {
  const returnMatch = source.match(/return\s*\{([\s\S]*?)\};/m);
  assert(returnMatch, 'Unable to parse fallback object from frontend-react adapter');

  return [...returnMatch[1].matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)].map((m) => m[1]);
}

function main() {
  const preloadSource = fs.readFileSync(preloadPath, 'utf8');
  const adapterSource = fs.readFileSync(adapterPath, 'utf8');

  const preloadMethods = collectExposedMethodsFromPreload(preloadSource);
  const adapterMethods = collectFallbackMethodsFromAdapter(adapterSource);

  const missingInAdapter = preloadMethods.filter((name) => !adapterMethods.includes(name));

  assert(!missingInAdapter.length, `Adapter fallback is missing methods from preload: ${missingInAdapter.join(', ')}`);

  process.stdout.write(`[verify-electron-adapter-parity] methods=${preloadMethods.length} parity=ok\n`);
}

main();
