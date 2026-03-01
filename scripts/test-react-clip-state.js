#!/usr/bin/env node

const test = require('node:test');
const assert = require('node:assert/strict');

async function loadClipModule() {
  return import('../frontend-react/src/features/clip/useClipState.js');
}

test('formatSeconds formats seconds into mm:ss.mmm', async () => {
  const mod = await loadClipModule();
  assert.equal(mod.formatSeconds(0), '00:00.000');
  assert.equal(mod.formatSeconds(12.345), '00:12.345');
  assert.equal(mod.formatSeconds(70.005), '01:10.005');
});

test('formatSeconds returns zero format for invalid numbers', async () => {
  const mod = await loadClipModule();
  assert.equal(mod.formatSeconds(-1), '00:00.000');
  assert.equal(mod.formatSeconds(Number.NaN), '00:00.000');
  assert.equal(mod.formatSeconds(undefined), '00:00.000');
});

test('getRangeText returns placeholder without full IN/OUT range', async () => {
  const mod = await loadClipModule();
  assert.equal(mod.getRangeText(null, null), 'IN/OUT не задан');
  assert.equal(mod.getRangeText(1, null), 'IN/OUT не задан');
  assert.equal(mod.getRangeText(null, 2), 'IN/OUT не задан');
});

test('getRangeText returns formatted IN/OUT range', async () => {
  const mod = await loadClipModule();
  assert.equal(mod.getRangeText(1.5, 3), '00:01.500 → 00:03.000');
});
