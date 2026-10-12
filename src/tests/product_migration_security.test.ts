import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { assertNotSensitivePath, detectSensitiveFileAccessInExec, isSensitivePath, runToolCall } from '../agent/tools.js';
import { codeSearchTool, globTool, readFileTool } from '../agent/filetools.js';
import { containsSensitiveFilePattern } from '../agent/subagent.js';
import { validateSnapshotPath } from '../core/undo.js';

for (const root of ['.kuro', '.ruko']) {
  test(`${root}: tool and undo guards reject the private data directory itself`, () => {
    const workspace = mkdtempSync(join(tmpdir(), 'kuro-root-guard-'));
    try {
      assert.equal(isSensitivePath(root, workspace), true);
      assert.throws(() => assertNotSensitivePath(root, workspace), /sensitif/i);
      assert.throws(() => validateSnapshotPath(join(workspace, root), workspace), /terproteksi/i);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  test(`${root}: an outer skills allowlist does not expose a nested private data root`, () => {
    const workspace = mkdtempSync(join(tmpdir(), 'kuro-nested-guard-'));
    try {
      const target = `${root}/skills/nested/${root}/history`;
      assert.equal(isSensitivePath(target, workspace), true);
      assert.throws(() => validateSnapshotPath(join(workspace, target), workspace), /terproteksi/i);
      assert.equal(isSensitivePath(`${root}/skills/project.md`, workspace), false);
      assert.doesNotThrow(() => validateSnapshotPath(join(workspace, root, 'plan.json'), workspace));
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  test(`${root}: file reads, search, shell prechecks and delegation protect private data`, async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'kuro-migration-guard-'));
    try {
      mkdirSync(join(workspace, root), { recursive: true });
      const target = `${root}/history`;
      writeFileSync(join(workspace, target), 'PRIVATE_TEST_NOTE\n');
      writeFileSync(join(workspace, 'public.txt'), 'PRIVATE_TEST_NOTE is a test marker\n');

      const read = await readFileTool(target, {}, workspace);
      assert.equal(read.ok, false);
      assert.ok(!read.text.includes('PRIVATE_TEST_NOTE'));
      const write = JSON.parse(await runToolCall(
        { tool: 'write_file', path: target, content: 'changed' },
        { workspaceRoot: workspace },
      ));
      assert.match(write.error, /sensitif/i);
      assert.equal(readFileSync(join(workspace, target), 'utf8'), 'PRIVATE_TEST_NOTE\n');

      const glob = await globTool('**/*', {}, workspace);
      assert.equal(glob.ok, true);
      assert.deepEqual(glob.files, ['public.txt']);
      const search = await codeSearchTool('PRIVATE_TEST_NOTE', {}, workspace);
      assert.equal(search.ok, true);
      assert.ok(search.text.includes('public.txt'));
      assert.ok(!search.text.includes(target));
      assert.equal(detectSensitiveFileAccessInExec(`cat ${root}/config.json`, workspace).blocked, true);
      assert.equal(detectSensitiveFileAccessInExec(`cat ${root}/*`, workspace).blocked, true);
      assert.equal(containsSensitiveFilePattern(`read ${root}/config.json`), true);
      assert.equal(containsSensitiveFilePattern(`read ${root}\\trusted`), true);
      assert.equal(containsSensitiveFilePattern(`read ${root}%2fconfig.json`), true);
      assert.equal(existsSync(join(workspace, '.kuro', 'undo')), false);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });
}
