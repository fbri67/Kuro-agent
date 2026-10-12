import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { defaultConfigPath, loadConfig } from '../core/config.js';
import { appendHistory, defaultHistoryPath, loadHistory } from '../core/history.js';
import { appendMemory, getMemoryPath, readMemory } from '../core/memory.js';
import { defaultSessionDir, loadSession, saveSession } from '../core/session.js';
import { defaultSkillsDir, readSkill, saveSkill } from '../core/skills.js';
import { defaultUndoDir, takeSnapshot, undoLast } from '../core/undo.js';
import { MutationCheckpoint } from '../core/mutationCheckpoint.js';
import { runNodeSync } from './helpers/platform.js';

for (const root of ['.kuro', '.ruko']) {
  test(`${root}: persisted config, history, memory, sessions, skills and undo remain usable`, async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'kuro-data-compat-'));
    const previousCwd = process.cwd();
    const overrides = ['KURO_CONFIG', 'RUKO_CONFIG', 'KURO_UNDO_DIR', 'RUKO_UNDO_DIR'];
    const saved = Object.fromEntries(overrides.map((key) => [key, process.env[key]]));
    try {
      for (const key of overrides) delete process.env[key];
      for (const name of ['sessions', 'skills', 'undo', 'checkpoints']) {
        mkdirSync(join(workspace, root, name), { recursive: true });
      }
      // An empty new directory must not hide existing legacy files or subdirectories.
      if (root === '.ruko') mkdirSync(join(workspace, '.kuro'));
      writeFileSync(join(workspace, root, 'config.json'), '{"model":"preserved-model"}\n');
      writeFileSync(join(workspace, root, 'memory.md'), 'preserved note\n');
      writeFileSync(join(workspace, root, 'history'), 'git status\n');
      process.chdir(workspace);

      assert.equal(defaultConfigPath(), join(workspace, root, 'config.json'));
      assert.equal(loadConfig().model, 'preserved-model');
      assert.equal(getMemoryPath(workspace), join(workspace, root, 'memory.md'));
      await appendMemory('Project uses TypeScript', workspace, new Date('2026-10-12T00:00:00Z'));
      assert.ok(readMemory(workspace)!.startsWith('preserved note\n'));
      assert.equal(defaultHistoryPath(), join(workspace, root, 'history'));
      appendHistory('npm test');
      assert.deepEqual(loadHistory(), ['git status', 'npm test']);

      assert.equal(defaultSessionDir(), join(workspace, root, 'sessions'));
      saveSession([{ role: 'user', content: 'preserved conversation', timestamp: '2026-10-12T00:00:00Z' }], undefined, 'compat-session');
      assert.equal(loadSession('compat-session')!.messages[0].content, 'preserved conversation');
      assert.equal(defaultSkillsDir(workspace), join(workspace, root, 'skills'));
      saveSkill('compat-skill', 'Project workflow', 'Run the project checks.', workspace);
      assert.equal(readSkill('compat-skill', workspace)!.description, 'Project workflow');

      const target = join(workspace, 'target.txt');
      writeFileSync(target, 'before');
      assert.equal(defaultUndoDir(), join(workspace, root, 'undo'));
      takeSnapshot(target);
      writeFileSync(target, 'after');
      assert.equal(undoLast(undefined, workspace)!.action, 'restored');
      assert.equal(readFileSync(target, 'utf8'), 'before');

      const checkpoint = new MutationCheckpoint(workspace);
      await checkpoint.capture(target);
      writeFileSync(target, 'interrupted');
      assert.equal(await MutationCheckpoint.recover(workspace), true);
      assert.equal(readFileSync(target, 'utf8'), 'before');

      if (root === '.ruko') {
        for (const name of ['config.json', 'memory.md', 'history', 'sessions', 'skills', 'undo', 'checkpoints']) {
          assert.equal(existsSync(join(workspace, '.kuro', name)), false, `${name} must remain in legacy storage`);
        }
      }
    } finally {
      process.chdir(previousCwd);
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  test(`${root}: global trust stays in the isolated home and workspace markers cannot self-authorize`, () => {
    const home = mkdtempSync(join(tmpdir(), 'kuro-trust-home-'));
    const workspace = mkdtempSync(join(tmpdir(), 'kuro-trust-ws-'));
    try {
      if (root === '.ruko') {
        mkdirSync(join(home, '.ruko'));
        writeFileSync(join(home, '.ruko', 'trusted-workspaces.json'), '{}');
        mkdirSync(join(home, '.kuro'));
      }
      mkdirSync(join(workspace, root));
      writeFileSync(join(workspace, root, 'trusted'), '{}');
      const script = [
        "import assert from 'node:assert/strict';",
        "import { join } from 'node:path';",
        "import { globalTrustStorePath, isWorkspaceTrusted, markWorkspaceTrusted } from './dist/core/trust.js';",
        `const workspace = ${JSON.stringify(workspace)};`,
        `assert.equal(globalTrustStorePath(), ${JSON.stringify(join(home, root, 'trusted-workspaces.json'))});`,
        'assert.equal(isWorkspaceTrusted(workspace), false);',
        `markWorkspaceTrusted(workspace, join(workspace, ${JSON.stringify(root)}, 'config.json'));`,
        'assert.equal(isWorkspaceTrusted(workspace), true);',
        "console.log('trust-compat-ok');",
      ].join('\n');
      assert.match(runNodeSync(['--input-type=module', '-e', script], {
        env: { HOME: home, USERPROFILE: home },
      }), /trust-compat-ok/);
      assert.ok(existsSync(join(home, root, 'trusted-workspaces.json')));
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(workspace, { recursive: true, force: true });
    }
  });
}
