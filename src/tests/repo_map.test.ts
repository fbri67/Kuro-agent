import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { generateRepoMap } from '../core/repoMap.js';

test('generateRepoMap extracts TypeScript symbols and AST import edges', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'ruko-map-'));
  try {
    mkdirSync(join(workspace, 'src'));
    writeFileSync(join(workspace, 'src', 'math.ts'), 'export function add(a: number, b: number): number { return a + b; }\nexport class Calculator {}\n');
    writeFileSync(join(workspace, 'src', 'index.ts'), "import { add } from './math.js';\nexport const total = add(2, 3);\n");
    mkdirSync(join(workspace, 'node_modules'));
    writeFileSync(join(workspace, 'node_modules', 'ignored.ts'), 'export function secret() {}');

    const map = await generateRepoMap(workspace);
    assert.ok(map.includes('src/index.ts'));
    assert.ok(map.includes('src/math.ts'));
    assert.ok(map.includes('add'));
    assert.ok(map.includes('Calculator'));
    assert.ok(map.includes('→ src/math.ts'));
    assert.ok(!map.includes('node_modules'));
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('generateRepoMap handles malformed source and caps large repositories', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'ruko-map-cap-'));
  try {
    writeFileSync(join(workspace, 'broken.ts'), 'export function {');
    writeFileSync(join(workspace, 'second.ts'), 'export const second = 2;');
    const map = await generateRepoMap(workspace, { maxFiles: 1 });
    assert.ok(map.includes('broken.ts'));
    assert.ok(map.includes('syntax unavailable'));
    assert.ok(map.includes('capped'));
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
