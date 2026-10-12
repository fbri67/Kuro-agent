import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { MutationCheckpoint } from '../core/mutationCheckpoint.js';

test('MutationCheckpoint restores edited/deleted files and removes newly created files', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ruko-checkpoint-'));
    const journal = join(workspace, '.ruko', 'checkpoints');
    try {
    const edited = join(workspace, 'edited.txt');
    const created = join(workspace, 'created.txt');
    const deleted = join(workspace, 'deleted.txt');
    writeFileSync(edited, 'old content');
    writeFileSync(deleted, 'restore me');

    const checkpoint = new MutationCheckpoint(workspace, journal);
    await checkpoint.capture(edited);
    await checkpoint.capture(created);
    await checkpoint.capture(deleted);
    writeFileSync(edited, 'new content');
    writeFileSync(created, 'new file');
    rmSync(deleted);

    await checkpoint.rollback();
    assert.equal(readFileSync(edited, 'utf8'), 'old content');
    assert.equal(existsSync(created), false);
    assert.equal(readFileSync(deleted, 'utf8'), 'restore me');
    assert.equal(await MutationCheckpoint.recover(workspace, journal), false);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(journal, { recursive: true, force: true });
  }
});

test('MutationCheckpoint validates all targets before capture and refuses escape paths', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'ruko-checkpoint-safe-'));
  const journal = join(workspace, '.ruko', 'checkpoints');
  try {
    const checkpoint = new MutationCheckpoint(workspace, journal);
    await assert.rejects(checkpoint.capture(join(workspace, '.env')), /terproteksi|sensitif/i);
    await assert.rejects(checkpoint.capture(join(workspace, '..', 'outside.txt')), /di luar working directory|workspace/i);
    assert.equal(await MutationCheckpoint.recover(workspace, journal), false);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(journal, { recursive: true, force: true });
  }
});

test('MutationCheckpoint recovers a durable interrupted transaction', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'ruko-checkpoint-recover-'));
  const journal = join(workspace, '.ruko', 'checkpoints');
  try {
    const file = join(workspace, 'data.txt');
    writeFileSync(file, 'before crash');
    const checkpoint = new MutationCheckpoint(workspace, journal);
    await checkpoint.capture(file);
    writeFileSync(file, 'partial batch state');

    assert.equal(await MutationCheckpoint.recover(workspace, journal), true);
    assert.equal(readFileSync(file, 'utf8'), 'before crash');
    assert.equal(await MutationCheckpoint.recover(workspace, journal), false);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(journal, { recursive: true, force: true });
  }
});
