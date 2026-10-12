import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { productDataDir, productDataPath } from '../core/productPaths.js';
import { tryCreateSymlink } from './helpers/platform.js';

for (const root of ['.kuro', '.ruko']) {
  test(`${root} storage selection rejects symbolic-link roots instead of following them`, (t) => {
    const base = mkdtempSync(join(tmpdir(), 'kuro-storage-root-'));
    const outside = mkdtempSync(join(tmpdir(), 'kuro-storage-outside-'));
    try {
      writeFileSync(join(outside, 'config.json'), '{}');
      if (!tryCreateSymlink(outside, join(base, root))) {
        t.skip('symlink creation unavailable');
        return;
      }
      assert.throws(() => productDataDir(base), /symbolic link|direktori data/i);
      assert.throws(() => productDataPath(base, 'config.json'), /symbolic link|direktori data/i);
    } finally {
      rmSync(base, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });
}

test('new installations use the Kuro data directory', () => {
  const base = mkdtempSync(join(tmpdir(), 'kuro-paths-new-'));
  try {
    assert.equal(productDataDir(base), join(base, '.kuro'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('existing Ruko data remains the active directory until migrated', () => {
  const base = mkdtempSync(join(tmpdir(), 'kuro-paths-legacy-'));
  try {
    mkdirSync(join(base, '.ruko'));
    assert.equal(productDataDir(base), join(base, '.ruko'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('an existing Kuro directory takes precedence over the legacy directory', () => {
  const base = mkdtempSync(join(tmpdir(), 'kuro-paths-preferred-'));
  try {
    mkdirSync(join(base, '.ruko'));
    mkdirSync(join(base, '.kuro'));
    assert.equal(productDataDir(base), join(base, '.kuro'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('new paths follow the active Kuro root while existing legacy paths remain selected', () => {
  const base = mkdtempSync(join(tmpdir(), 'kuro-paths-mixed-'));
  try {
    mkdirSync(join(base, '.kuro'));
    mkdirSync(join(base, '.ruko'));
    writeFileSync(join(base, '.ruko', 'history'), 'legacy history');
    assert.equal(productDataPath(base, 'history'), join(base, '.ruko', 'history'));
    assert.equal(productDataPath(base, 'sessions'), join(base, '.kuro', 'sessions'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('an existing Kuro data path takes precedence when both product paths exist', () => {
  const base = mkdtempSync(join(tmpdir(), 'kuro-paths-both-'));
  try {
    mkdirSync(join(base, '.kuro'));
    mkdirSync(join(base, '.ruko'));
    writeFileSync(join(base, '.kuro', 'history'), 'current history');
    writeFileSync(join(base, '.ruko', 'history'), 'legacy history');
    assert.equal(productDataPath(base, 'history'), join(base, '.kuro', 'history'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('productDataPath preserves an existing legacy file even if the new root exists', () => {
  const base = mkdtempSync(join(tmpdir(), 'kuro-paths-legacy-file-'));
  try {
    mkdirSync(join(base, '.kuro'));
    mkdirSync(join(base, '.ruko'));
    writeFileSync(join(base, '.ruko', 'config.json'), '{}');
    assert.equal(productDataPath(base, 'config.json'), join(base, '.ruko', 'config.json'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
