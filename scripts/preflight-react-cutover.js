#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function parseArgs(argv) {
  return {
    strict: argv.includes('--strict'),
  };
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const checks = [
    {
      id: 'electron-cli',
      required: true,
      ok: exists('node_modules/electron/cli.js'),
      hint: 'Run: npm ci',
    },
    {
      id: 'backend-entry',
      required: true,
      ok: exists('backend/app/main.py'),
      hint: 'Ensure backend sources are present in repository checkout',
    },
    {
      id: 'renderer-resolver',
      required: true,
      ok: exists('scripts/renderer-target.js'),
      hint: 'Check cutover scripts are present on current branch',
    },
    {
      id: 'react-dist',
      required: false,
      ok: exists('frontend-react/dist/index.html'),
      hint: 'Build renderer: npm run react:build',
    },
  ];

  const requiredFailures = checks.filter((c) => c.required && !c.ok);
  const optionalMissing = checks.filter((c) => !c.required && !c.ok);

  process.stdout.write('[preflight-react-cutover] environment snapshot\n');
  checks.forEach((c) => {
    const marker = c.ok ? 'ok' : (c.required ? 'missing-required' : 'missing-optional');
    process.stdout.write(`  - ${c.id}: ${marker}\n`);
    if (!c.ok) {
      process.stdout.write(`    hint: ${c.hint}\n`);
    }
  });

  process.stdout.write('\n[preflight-react-cutover] manual beta command checklist\n');
  [
    'npm ci',
    'npm --prefix frontend-react install',
    'npm run react:build',
    'npm run react:electron:auto',
    'npm run build:desktop-react',
  ].forEach((cmd, idx) => {
    process.stdout.write(`  ${idx + 1}. ${cmd}\n`);
  });

  if (optionalMissing.length) {
    process.stdout.write(`\n[preflight-react-cutover] optional_missing=${optionalMissing.length}\n`);
  }

  if (requiredFailures.length > 0) {
    process.stdout.write(`\n[preflight-react-cutover] required_missing=${requiredFailures.length}\n`);
    if (args.strict) {
      process.exit(1);
    }
  }
}

main();
