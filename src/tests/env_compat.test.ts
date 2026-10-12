import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deleteProductEnv, getProductEnv, setProductEnv } from '../core/envCompat.js';

test('KURO_ environment variables take precedence over RUKO_ compatibility aliases', () => {
  assert.equal(getProductEnv('CONFIG', { KURO_CONFIG: '/new/config', RUKO_CONFIG: '/old/config' }), '/new/config');
});

test('legacy RUKO_ environment variables remain available when KURO_ is unset', () => {
  assert.equal(getProductEnv('CONFIG', { RUKO_CONFIG: '/old/config' }), '/old/config');
});

test('an explicitly empty KURO_ value takes precedence instead of falling back', () => {
  assert.equal(getProductEnv('CONFIG', { KURO_CONFIG: '', RUKO_CONFIG: '/old/config' }), '');
});

test('setProductEnv sets only the Kuro variable and deleteProductEnv removes both aliases', () => {
  const savedKuro = process.env.KURO_TEST_SETTING;
  const savedRuko = process.env.RUKO_TEST_SETTING;
  try {
    delete process.env.KURO_TEST_SETTING;
    delete process.env.RUKO_TEST_SETTING;
    setProductEnv('TEST_SETTING', 'kuro-value');
    process.env.RUKO_TEST_SETTING = 'legacy-value';
    assert.equal(process.env.KURO_TEST_SETTING, 'kuro-value');
    assert.equal(getProductEnv('TEST_SETTING'), 'kuro-value');
    deleteProductEnv('TEST_SETTING');
    assert.equal(process.env.KURO_TEST_SETTING, undefined);
    assert.equal(process.env.RUKO_TEST_SETTING, undefined);
  } finally {
    if (savedKuro === undefined) delete process.env.KURO_TEST_SETTING;
    else process.env.KURO_TEST_SETTING = savedKuro;
    if (savedRuko === undefined) delete process.env.RUKO_TEST_SETTING;
    else process.env.RUKO_TEST_SETTING = savedRuko;
  }
});
