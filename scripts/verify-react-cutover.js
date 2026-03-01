#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { resolveRendererTarget } = require('./renderer-target');

const projectRoot = path.join(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyPackageConfig() {
  const files = packageJson?.build?.files || [];
  assert(files.includes('frontend-react/dist/**/*'), 'electron-builder files must include frontend-react/dist/**/*');

  const scripts = packageJson?.scripts || {};
  assert(Boolean(scripts['build:react-renderer']), 'missing npm script build:react-renderer');
  assert(Boolean(scripts['build:desktop-react']), 'missing npm script build:desktop-react');
  assert(Boolean(scripts['react:electron']), 'missing npm script react:electron');
  assert(Boolean(scripts['react:electron:auto']), 'missing npm script react:electron:auto');
  assert(Boolean(scripts['react:electron:legacy']), 'missing npm script react:electron:legacy');
  assert(Boolean(scripts['test:renderer-target']), 'missing npm script test:renderer-target');
}

function verifyResolverScenarios() {
  const fakeFs = (existingPaths) => (candidate) => existingPaths.has(candidate);

  const legacyPath = path.join(projectRoot, 'frontend', 'index.html');
  const repoDist = path.join(projectRoot, 'frontend-react', 'dist', 'index.html');
  const packagedDist = path.join('/pkg-resources', 'frontend-react', 'dist', 'index.html');

  const legacy = resolveRendererTarget({
    env: { PLAYE_UI: 'legacy' },
    projectRoot,
    resourcesPath: '/pkg-resources',
    fileExists: fakeFs(new Set()),
  });
  assert(legacy.mode === 'legacy' && legacy.value === legacyPath, 'legacy resolver scenario failed');

  const devServer = resolveRendererTarget({
    env: { PLAYE_UI: 'react', REACT_DEV_SERVER_URL: 'http://127.0.0.1:5173' },
    projectRoot,
    resourcesPath: '/pkg-resources',
    fileExists: fakeFs(new Set()),
  });
  assert(devServer.mode === 'react-dev-server' && devServer.type === 'url', 'react dev server scenario failed');

  const repoDistCase = resolveRendererTarget({
    env: { PLAYE_UI: 'react' },
    projectRoot,
    resourcesPath: '/pkg-resources',
    fileExists: fakeFs(new Set([repoDist])),
  });
  assert(repoDistCase.mode === 'react-dist' && repoDistCase.value === repoDist, 'repo dist scenario failed');

  const packagedDistCase = resolveRendererTarget({
    env: { PLAYE_UI: 'react' },
    projectRoot,
    resourcesPath: '/pkg-resources',
    fileExists: fakeFs(new Set([packagedDist])),
  });
  assert(packagedDistCase.mode === 'react-dist' && packagedDistCase.value === packagedDist, 'packaged dist scenario failed');

  const fallback = resolveRendererTarget({
    env: { PLAYE_UI: 'react' },
    projectRoot,
    resourcesPath: '/pkg-resources',
    fileExists: fakeFs(new Set()),
  });
  assert(fallback.mode === 'legacy-fallback' && fallback.value === legacyPath, 'react fallback scenario failed');

  const autoFallback = resolveRendererTarget({
    env: { PLAYE_UI: 'auto' },
    projectRoot,
    resourcesPath: '/pkg-resources',
    fileExists: fakeFs(new Set()),
  });
  assert(autoFallback.mode === 'auto-fallback' && autoFallback.value === legacyPath, 'auto fallback scenario failed');

  const defaultMode = resolveRendererTarget({
    env: {},
    projectRoot,
    resourcesPath: '/pkg-resources',
    fileExists: fakeFs(new Set()),
  });
  assert(defaultMode.mode === 'auto-fallback' && defaultMode.value === legacyPath, 'default auto mode scenario failed');
}



function main() {
  verifyPackageConfig();
  verifyResolverScenarios();
  process.stdout.write('[verify-react-cutover] all checks passed\n');
}

main();
