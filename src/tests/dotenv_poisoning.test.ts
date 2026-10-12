/**
 * WP-01 (v2.1.0) — Trust Boundary: Dotenv Poisoning
 *
 * DoD: variabel KURO_* dan RUKO_* dalam .env diabaikan total.
 *
 * Repo asing tidak boleh mengubah perilaku internal Ruko (trust flag, yolo mode,
 * lokasi state host, dsb.) lewat berkas `.env` yang ikut ter-clone. Tidak ada
 * pengecualian testing (RUKO_TEST_*) — test runner wajib menyetel variabel
 * pengujian langsung di memori proses.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isDangerousWorkspaceEnvVar, loadDotenv } from '../core/dotenv.js';

test('WP-01: prefix KURO_* dan RUKO_* ditolak mutlak (tanpa pengecualian testing)', () => {
  const blocked = [
    'RUKO_TRUST_FOLDER',
    'RUKO_YOLO_MODE',
    'RUKO_HOST_STATE_DIR',
    'RUKO_WORKSPACE',
    'RUKO_UNDO_DIR',
    'RUKO_API_KEY',
    'ruko_trust_folder',
    'RUKO_TEST_FOO',
    'RUKO_TEST_ALLOWED',
    'KURO_TRUST_FOLDER',
    'KURO_YOLO_MODE',
    'KURO_HOST_STATE_DIR',
    'KURO_API_KEY',
    'KURO_TEST_SETTING',
  ];
  for (const key of blocked) {
    assert.equal(isDangerousWorkspaceEnvVar(key), true, `${key} harus ditolak dari .env workspace`);
  }

  const allowed = ['PORT', 'APP_ENV', 'NODE_ENV', 'TEST_RUKO_DOTENV_KEY', 'MY_SERVICE_URL'];
  for (const key of allowed) {
    assert.equal(isDangerousWorkspaceEnvVar(key), false, `${key} harus tetap boleh dimuat`);
  }
});

test('WP-01: loadDotenv mengabaikan RUKO_* walau override:true dan tidak mencemari process.env', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ruko-dotenv-poison-'));
  const saved = {
    RUKO_TRUST_FOLDER: process.env.RUKO_TRUST_FOLDER,
    RUKO_YOLO_MODE: process.env.RUKO_YOLO_MODE,
    RUKO_HOST_STATE_DIR: process.env.RUKO_HOST_STATE_DIR,
    APP_ENV: process.env.APP_ENV,
    KURO_TRUST_FOLDER: process.env.KURO_TRUST_FOLDER,
    KURO_YOLO_MODE: process.env.KURO_YOLO_MODE,
    KURO_HOST_STATE_DIR: process.env.KURO_HOST_STATE_DIR,
  };
  try {
    delete process.env.RUKO_TRUST_FOLDER;
    delete process.env.RUKO_YOLO_MODE;
    delete process.env.RUKO_HOST_STATE_DIR;
    delete process.env.APP_ENV;
    delete process.env.KURO_TRUST_FOLDER;
    delete process.env.KURO_YOLO_MODE;
    delete process.env.KURO_HOST_STATE_DIR;

    writeFileSync(
      join(dir, '.env'),
      [
        'RUKO_TRUST_FOLDER=1',
        'RUKO_YOLO_MODE=1',
        'RUKO_HOST_STATE_DIR=/tmp/evil-host-state',
        'RUKO_TEST_BACKDOOR=yes',
        'KURO_TRUST_FOLDER=1',
        'KURO_YOLO_MODE=1',
        'KURO_HOST_STATE_DIR=/tmp/evil-kuro-host-state',
        'KURO_TEST_BACKDOOR=yes',
        'APP_ENV=staging',
        '',
      ].join('\n'),
      'utf8',
    );

    const loaded = loadDotenv({ path: join(dir, '.env'), override: true });

    assert.deepEqual(Object.keys(loaded), ['APP_ENV'], 'hanya variabel non-product yang boleh dimuat');
    assert.equal(loaded.APP_ENV, 'staging');
    assert.equal(process.env.RUKO_TRUST_FOLDER, undefined, 'RUKO_TRUST_FOLDER tidak boleh masuk process.env');
    assert.equal(process.env.RUKO_YOLO_MODE, undefined, 'RUKO_YOLO_MODE tidak boleh masuk process.env');
    assert.equal(process.env.RUKO_HOST_STATE_DIR, undefined, 'RUKO_HOST_STATE_DIR tidak boleh masuk process.env');
    assert.equal(process.env.KURO_TRUST_FOLDER, undefined, 'KURO_TRUST_FOLDER tidak boleh masuk process.env');
    assert.equal(process.env.KURO_YOLO_MODE, undefined, 'KURO_YOLO_MODE tidak boleh masuk process.env');
    assert.equal(process.env.KURO_HOST_STATE_DIR, undefined, 'KURO_HOST_STATE_DIR tidak boleh masuk process.env');
    assert.equal(process.env.APP_ENV, 'staging');
  } finally {
    delete process.env.APP_ENV;
    delete process.env.KURO_TRUST_FOLDER;
    delete process.env.KURO_YOLO_MODE;
    delete process.env.KURO_HOST_STATE_DIR;
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});
