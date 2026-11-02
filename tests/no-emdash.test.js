// Keeps the em dash out of the project (code, comments, docs and UI strings).
// The character is built from its code point so this file does not contain it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const EM_DASH = String.fromCodePoint(0x2014);
const root = new URL('..', import.meta.url).pathname;
const SKIP_DIRS = new Set(['node_modules', '.git', 'vendor']);
const TEXT = new Set(['.js', '.mjs', '.css', '.html', '.md', '.json', '.svg', '.yml', '.toml', '.webmanifest', '']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (TEXT.has(extname(name)) && name !== 'LICENSE') yield full;
  }
}

test('no em dash anywhere in the project', () => {
  const hits = [];
  for (const file of walk(root)) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (line.includes(EM_DASH)) hits.push(`${file.slice(root.length)}:${i + 1}`);
    });
  }
  assert.deepEqual(hits, [], 'replace the em dash with a comma, colon, period or parentheses');
});
