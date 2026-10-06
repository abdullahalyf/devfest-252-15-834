import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const [url, expectedCommit] = process.argv.slice(2);
assert.ok(url && expectedCommit, 'Usage: node scripts/verify-release.mjs <https-url> <full-commit-sha>');
assert.equal(new URL(url).protocol, 'https:');
const response = await fetch(new URL('/release.json', url), { signal: AbortSignal.timeout(20000), cache: 'no-store' });
assert.equal(response.status, 200, 'Public release manifest is accessible without authentication');
const manifest = await response.json();
assert.equal(manifest.commit, expectedCommit);
assert.ok(Object.keys(manifest.artifacts).length >= 3);
for (const [name, hash] of Object.entries(manifest.artifacts)) {
  const asset = await fetch(new URL(name, url + '/'), { signal: AbortSignal.timeout(20000), cache: 'no-store' });
  assert.equal(asset.status, 200, `Asset accessible: ${name}`);
  const actual = createHash('sha256').update(new Uint8Array(await asset.arrayBuffer())).digest('hex');
  assert.equal(actual, hash, `Exact committed-build artifact: ${name}`);
  console.log(`PASS ${name}: SHA-256 matches release manifest`);
}
console.log(`VERIFIED public HTTPS release from ${manifest.commit}`);
