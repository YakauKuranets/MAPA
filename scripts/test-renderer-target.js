const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { resolveRendererTarget } = require('./renderer-target');

const ROOT = '/app';

const existsOnly = (allowed) => (p) => allowed.includes(p);

test('legacy mode is frozen by default and redirected to react dist when available', () => {
  const repoDist = path.join(ROOT, 'frontend-react', 'dist', 'index.html');
  const out = resolveRendererTarget({
    env: { PLAYE_UI: 'legacy' },
    projectRoot: ROOT,
    resourcesPath: '/resources',
    fileExists: existsOnly([repoDist]),
  });
  assert.equal(out.mode, 'legacy-frozen-react-dist');
  assert.equal(out.type, 'file');
  assert.equal(out.value, repoDist);
});

test('legacy mode can be explicitly unfrozen', () => {
  const out = resolveRendererTarget({
    env: { PLAYE_UI: 'legacy', PLAYE_LEGACY_UI_FROZEN: '0' },
    projectRoot: ROOT,
    resourcesPath: '/resources',
    fileExists: () => false,
  });
  assert.equal(out.mode, 'legacy');
  assert.equal(out.type, 'file');
  assert.equal(out.value, path.join(ROOT, 'frontend', 'index.html'));
});

test('returns react dev server URL when REACT_DEV_SERVER_URL is set', () => {
  const out = resolveRendererTarget({
    env: { PLAYE_UI: 'react', REACT_DEV_SERVER_URL: 'http://127.0.0.1:5173' },
    projectRoot: ROOT,
    fileExists: () => false,
  });
  assert.equal(out.mode, 'react-dev-server');
  assert.equal(out.type, 'url');
});

test('returns repo react dist when it exists', () => {
  const repoDist = path.join(ROOT, 'frontend-react', 'dist', 'index.html');
  const out = resolveRendererTarget({
    env: { PLAYE_UI: 'react' },
    projectRoot: ROOT,
    resourcesPath: '/resources',
    fileExists: existsOnly([repoDist]),
  });
  assert.equal(out.mode, 'react-dist');
  assert.equal(out.value, repoDist);
});

test('returns packaged react dist when repo dist is absent', () => {
  const packagedDist = path.join('/resources', 'frontend-react', 'dist', 'index.html');
  const out = resolveRendererTarget({
    env: { PLAYE_UI: 'react' },
    projectRoot: ROOT,
    resourcesPath: '/resources',
    fileExists: existsOnly([packagedDist]),
  });
  assert.equal(out.mode, 'react-dist');
  assert.equal(out.value, packagedDist);
});

test('falls back to legacy when react artifacts are missing', () => {
  const out = resolveRendererTarget({
    env: { PLAYE_UI: 'react' },
    projectRoot: ROOT,
    resourcesPath: '/resources',
    fileExists: () => false,
  });
  assert.equal(out.mode, 'legacy-fallback');
  assert.equal(out.value, path.join(ROOT, 'frontend', 'index.html'));
});


test('auto mode prefers packaged repo dist when available', () => {
  const repoDist = path.join(ROOT, 'frontend-react', 'dist', 'index.html');
  const out = resolveRendererTarget({
    env: { PLAYE_UI: 'auto' },
    projectRoot: ROOT,
    resourcesPath: '/resources',
    fileExists: existsOnly([repoDist]),
  });
  assert.equal(out.mode, 'react-dist');
  assert.equal(out.value, repoDist);
});

test('auto mode falls back to legacy when no react target exists', () => {
  const out = resolveRendererTarget({
    env: { PLAYE_UI: 'auto' },
    projectRoot: ROOT,
    resourcesPath: '/resources',
    fileExists: () => false,
  });
  assert.equal(out.mode, 'auto-fallback');
  assert.equal(out.value, path.join(ROOT, 'frontend', 'index.html'));
});


test('defaults to auto mode when PLAYE_UI is not set', () => {
  const out = resolveRendererTarget({
    env: {},
    projectRoot: ROOT,
    resourcesPath: '/resources',
    fileExists: () => false,
  });
  assert.equal(out.mode, 'auto-fallback');
  assert.equal(out.value, path.join(ROOT, 'frontend', 'index.html'));
});
