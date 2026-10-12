import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, after } from 'node:test';
import { applySearchReplace, capToolResult, runToolCall, setWorkspaceRoot, TOOL_RESULT_CHAR_LIMIT } from '../agent/tools.js';
import { MutationCheckpoint } from '../core/mutationCheckpoint.js';
import { DEFAULT_CONFIG } from '../types.js';
import { takeSnapshot } from '../core/undo.js';

const testWorkspace = mkdtempSync(join(tmpdir(), 'ruko-ws-pf-'));
setWorkspaceRoot(testWorkspace);

// Keep undo snapshots out of the repo during tests.
const undoDir = mkdtempSync(join(tmpdir(), 'ruko-undo-env-'));
process.env.RUKO_UNDO_DIR = undoDir;
after(() => {
  setWorkspaceRoot(null);
  rmSync(testWorkspace, { recursive: true, force: true });
  delete process.env.RUKO_UNDO_DIR;
  rmSync(undoDir, { recursive: true, force: true });
});

test('applySearchReplace replaces a unique snippet (§5 search-replace)', () => {
  const out = applySearchReplace('a\nb target c\nd', 'b target c', 'B FIXED');
  assert.equal(out, 'a\nB FIXED\nd');
});

test('applySearchReplace rejects missing and ambiguous matches', () => {
  assert.throws(() => applySearchReplace('abc', 'zzz', 'x'), /tidak ditemukan/);
  assert.throws(() => applySearchReplace('x x x', 'x', 'y'), /lebih dari satu/);
  assert.equal(applySearchReplace('x x', 'x', 'y', true), 'y y');
});

test('applySearchReplace rejects identical old/new', () => {
  assert.throws(() => applySearchReplace('same', 'same', 'same'), /identik/);
});

test('patch_file tool applies and writes the file', async () => {
  const file = join(testWorkspace, 'p.txt');
  writeFileSync(file, 'halo dunia\nbaris dua\n', 'utf8');
  const logs: string[] = [];
  const result = await runToolCall(
    { tool: 'patch_file', path: file, oldText: 'halo dunia', newText: 'hai dunia' },
    { onLog: (l) => logs.push(l) },
  );
  assert.equal(readFileSync(file, 'utf8'), 'hai dunia\nbaris dua\n');
  assert.ok((JSON.parse(result) as { ok: boolean }).ok);
});

test('patch_file surfaces a helpful error when oldText is stale', async () => {
  const file = join(testWorkspace, 'q.txt');
  writeFileSync(file, 'isi asli\n', 'utf8');
  const result = JSON.parse(
    await runToolCall({ tool: 'patch_file', path: file, oldText: 'tidak ada', newText: 'x' }, {}),
  ) as { error?: string };
  assert.match(result.error ?? '', /tidak ditemukan/);
  assert.equal(readFileSync(file, 'utf8'), 'isi asli\n', 'file untouched on failed patch');
});

test('runToolCall captures a mutation before writing so a turn can roll it back', async () => {
  const file = join(testWorkspace, 'checkpointed.txt');
  writeFileSync(file, 'before mutation\n', 'utf8');
  const checkpoint = new MutationCheckpoint(testWorkspace);
  const result = await runToolCall(
    { tool: 'patch_file', path: file, oldText: 'before', newText: 'after' },
    { mutationCheckpoint: checkpoint },
  );
  assert.equal((JSON.parse(result) as { ok: boolean }).ok, true);
  assert.equal(readFileSync(file, 'utf8'), 'after mutation\n');
  await checkpoint.rollback();
  assert.equal(readFileSync(file, 'utf8'), 'before mutation\n');
});

test('delete_skill checkpoint restores a nested SKILL.md after rollback', async () => {
  const skillFile = join(testWorkspace, '.ruko', 'skills', 'nested-skill', 'SKILL.md');
  const siblingFile = join(testWorkspace, '.ruko', 'skills', 'nested-skill', 'notes.txt');
  mkdirSync(join(testWorkspace, '.ruko', 'skills', 'nested-skill'), { recursive: true });
  writeFileSync(skillFile, '---\nname: nested-skill\ndescription: nested\n---\n\nInstructions\n', 'utf8');
  writeFileSync(siblingFile, 'keep sibling', 'utf8');
  const checkpoint = new MutationCheckpoint(testWorkspace);

  const result = JSON.parse(await runToolCall(
    { tool: 'delete_skill', name: 'nested-skill' },
    { workspaceRoot: testWorkspace, mutationCheckpoint: checkpoint, config: { ...DEFAULT_CONFIG, approvalEnabled: false } },
  )) as { ok?: boolean };
  assert.equal(result.ok, true);
  assert.equal(existsSync(skillFile), false);
  assert.equal(readFileSync(siblingFile, 'utf8'), 'keep sibling');

  await checkpoint.rollback();
  assert.equal(readFileSync(skillFile, 'utf8'), '---\nname: nested-skill\ndescription: nested\n---\n\nInstructions\n');
});

test('remember, save_skill, and delete_file mutations are covered by turn rollback', async () => {
  const memoryPath = join(testWorkspace, '.ruko', 'memory.md');
  const deletedPath = join(testWorkspace, 'delete-me.txt');
  writeFileSync(deletedPath, 'restore this file', 'utf8');
  const checkpoint = new MutationCheckpoint(testWorkspace);
  const deps = { workspaceRoot: testWorkspace, mutationCheckpoint: checkpoint, config: { ...DEFAULT_CONFIG, approvalEnabled: false } };

  assert.equal((JSON.parse(await runToolCall({ tool: 'remember', content: 'Checkpoint test note' }, deps)) as { ok?: boolean }).ok, true);
  assert.equal((JSON.parse(await runToolCall({ tool: 'save_skill', name: 'checkpoint-skill', description: 'test', instructions: 'instructions' }, deps)) as { ok?: boolean }).ok, true);
  assert.equal((JSON.parse(await runToolCall({ tool: 'delete_file', path: 'delete-me.txt' }, deps)) as { ok?: boolean }).ok, true);

  await checkpoint.rollback();
  assert.equal(existsSync(memoryPath), false, 'new memory file is removed by rollback');
  assert.equal(existsSync(join(testWorkspace, '.ruko', 'skills', 'checkpoint-skill.md')), false);
  assert.equal(readFileSync(deletedPath, 'utf8'), 'restore this file');
});

test('write, edit, move, and revert tool paths all restore their pre-turn state', async () => {
  const depsFor = (mutationCheckpoint: MutationCheckpoint) => ({
    workspaceRoot: testWorkspace,
    mutationCheckpoint,
    config: { ...DEFAULT_CONFIG, approvalEnabled: false },
  });
  const created = join(testWorkspace, 'created-by-write.txt');
  const edited = join(testWorkspace, 'edited-by-tool.txt');
  const source = join(testWorkspace, 'move-source.txt');
  const target = join(testWorkspace, 'move-target.txt');
  const reverted = join(testWorkspace, 'reverted.txt');

  writeFileSync(edited, 'before edit', 'utf8');
  writeFileSync(source, 'before move', 'utf8');
  writeFileSync(reverted, 'before snapshot', 'utf8');

  const checkpoint = new MutationCheckpoint(testWorkspace);
  const deps = depsFor(checkpoint);
  const writeResult = JSON.parse(await runToolCall({ tool: 'write_file', path: 'created-by-write.txt', content: 'new file' }, deps)) as { ok?: boolean };
  const editResult = JSON.parse(await runToolCall({ tool: 'edit_file', path: 'edited-by-tool.txt', content: 'after edit' }, deps)) as { ok?: boolean };
  const moveResult = JSON.parse(await runToolCall({ tool: 'move_file', source: 'move-source.txt', target: 'move-target.txt' }, deps)) as { ok?: boolean };

  takeSnapshot(reverted);
  writeFileSync(reverted, 'after snapshot', 'utf8');
  const revertResult = JSON.parse(await runToolCall({ tool: 'revert_file', path: 'reverted.txt', mode: 'snapshot' }, deps)) as { ok?: boolean };

  assert.equal(writeResult.ok, true);
  assert.equal(editResult.ok, true);
  assert.equal(moveResult.ok, true);
  assert.equal(revertResult.ok, true);
  await checkpoint.rollback();

  assert.equal(existsSync(created), false);
  assert.equal(readFileSync(edited, 'utf8'), 'before edit');
  assert.equal(readFileSync(source, 'utf8'), 'before move');
  assert.equal(existsSync(target), false);
  assert.equal(readFileSync(reverted, 'utf8'), 'after snapshot');
});

test('exec refuses direct workspace file writes before they can bypass checkpoints', async () => {
  const file = join(testWorkspace, 'shell-target.txt');
  writeFileSync(file, 'untouched', 'utf8');
  const checkpoint = new MutationCheckpoint(testWorkspace);
  const result = JSON.parse(await runToolCall(
    { tool: 'exec', command: 'echo changed > shell-target.txt' },
    { workspaceRoot: testWorkspace, mutationCheckpoint: checkpoint, config: { ...DEFAULT_CONFIG, approvalEnabled: false } },
  )) as { error?: string };
  assert.match(result.error ?? '', /ditolak/i);
  assert.equal(readFileSync(file, 'utf8'), 'untouched');
  await checkpoint.rollback();
});

test('repo_map is available as a read-only agent tool', async () => {
  const sourceDir = join(testWorkspace, 'map-src');
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(join(sourceDir, 'entry.ts'), 'export const answer = 42;\n');
  const result = await runToolCall({ tool: 'repo_map', path: 'map-src' }, { workspaceRoot: testWorkspace });
  assert.match(result, /entry\.ts/);
  assert.match(result, /answer/);
  assert.match(await runToolCall({ tool: 'repo_map', path: '.env' }, { workspaceRoot: testWorkspace }), /error/i);
});

test('capToolResult head+tail caps huge results (§5.31)', () => {
  const huge = 'x'.repeat(TOOL_RESULT_CHAR_LIMIT * 3);
  const capped = capToolResult(huge);
  assert.ok(capped.length < TOOL_RESULT_CHAR_LIMIT + 200);
  assert.ok(capped.includes('TRUNCATED'));
  assert.ok(capped.startsWith('xxx'));
  assert.ok(capped.endsWith('xxx'));
  assert.equal(capToolResult('kecil'), 'kecil');
});

test('plan mode blocks mutating tools in CODE (§6.38)', async () => {
  for (const tool of ['exec', 'write_file', 'edit_file', 'patch_file']) {
    const result = await runToolCall({ tool }, { planMode: true });
    assert.match(result, /plan mode aktif/, `${tool} should be blocked`);
  }
  // read_file stays allowed (probe: error must NOT be the plan-mode message)
  const read = await runToolCall({ tool: 'read_file', path: '__nope__' }, { planMode: true });
  assert.ok(!read.includes('plan mode aktif'));
});

test('patch_file rejects path outside workspace (H1 sandbox)', async () => {
  const result = JSON.parse(
    await runToolCall(
      { tool: 'patch_file', path: '/etc/passwd', oldText: 'root', newText: 'toor' },
      {},
    ),
  ) as { error?: string };
  assert.match(result.error ?? '', /di luar working directory/);
});
