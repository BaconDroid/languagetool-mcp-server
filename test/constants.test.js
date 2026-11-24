import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const URL_KEY = 'LANGUAGETOOL_URL';
const LIMIT_KEY = 'LANGUAGETOOL_CHAR_LIMIT';

let loadCount = 0;

// constants.ts reads process.env at import time, so each case needs a fresh
// module instance - the cache-busting query string provides that.
async function loadConstants(env) {
  const saved = {};
  for (const [key, value] of Object.entries(env)) {
    saved[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    loadCount += 1;
    return await import(`../dist/constants.js?case=${loadCount}`);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('defaults to the LanguageTool Pro API and 40000 characters', async () => {
  const constants = await loadConstants({ [URL_KEY]: undefined, [LIMIT_KEY]: undefined });
  assert.equal(constants.LT_API_URL, 'https://api.languagetoolplus.com/v2');
  assert.equal(constants.CHARACTER_LIMIT, 40000);
  assert.equal(typeof constants.CHARACTER_LIMIT, 'number');
});

test('LANGUAGETOOL_URL overrides the API base URL', async () => {
  const constants = await loadConstants({
    [URL_KEY]: 'http://127.0.0.1:8010/v2',
    [LIMIT_KEY]: undefined,
  });
  assert.equal(constants.LT_API_URL, 'http://127.0.0.1:8010/v2');
});

test('LANGUAGETOOL_CHAR_LIMIT overrides the character limit', async () => {
  const constants = await loadConstants({
    [URL_KEY]: undefined,
    [LIMIT_KEY]: '12345',
  });
  assert.equal(constants.CHARACTER_LIMIT, 12345);
});

test('Dockerfile, entrypoint and README agree on the Java heap variables', async () => {
  const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const dockerfile = read('Dockerfile');
  const entrypoint = read('entrypoint-mcp.sh');
  const readme = read('README.md');

  const dockerXms = dockerfile.match(/Java_Xms="([^"]+)"/);
  const dockerXmx = dockerfile.match(/Java_Xmx="([^"]+)"/);
  assert.ok(dockerXms, 'Dockerfile must declare Java_Xms');
  assert.ok(dockerXmx, 'Dockerfile must declare Java_Xmx');

  const entryXms = entrypoint.match(/\$\{Java_Xms:-([^}]+)\}/);
  const entryXmx = entrypoint.match(/\$\{Java_Xmx:-([^}]+)\}/);
  assert.ok(entryXms, 'entrypoint must read Java_Xms');
  assert.ok(entryXmx, 'entrypoint must read Java_Xmx');

  assert.equal(entryXms[1], dockerXms[1], 'entrypoint fallback must match Dockerfile default');
  assert.equal(entryXmx[1], dockerXmx[1], 'entrypoint fallback must match Dockerfile default');

  assert.ok(readme.includes('`Java_Xms`'), 'README must document Java_Xms');
  assert.ok(readme.includes('`Java_Xmx`'), 'README must document Java_Xmx');
  assert.ok(!readme.includes('JAVA_XMS'), 'README must not document the dead JAVA_XMS name');
  assert.ok(!readme.includes('JAVA_XMX'), 'README must not document the dead JAVA_XMX name');
  assert.ok(!dockerfile.includes('JAVA_XMS'), 'Dockerfile must not set the dead JAVA_XMS name');
  assert.ok(!dockerfile.includes('JAVA_XMX'), 'Dockerfile must not set the dead JAVA_XMX name');
});
