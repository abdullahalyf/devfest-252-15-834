// Build an isolated archive of HEAD, then package only static output for Railway.
// Provenance is a generated artifact so it does not create a self-referential SHA.
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, writeFile, symlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const commit = git(['rev-parse', 'HEAD']);
const snapshot = path.join(root, '.release-static', 'source-' + commit);
await mkdir(snapshot, { recursive: true });
const archive = path.join(root, '.release-static', commit + '.tar');
execFileSync('git', ['archive', '--format=tar', '--output=' + archive, commit], { cwd: root });
execFileSync('tar.exe', ['-xf', archive, '-C', snapshot]);
// Dependencies are installed from the committed lockfile. Fail if it has changed.
if (JSON.stringify(JSON.parse(await readFile(path.join(snapshot, 'package-lock.json'), 'utf8'))) !== JSON.stringify(JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8')))) {
  throw new Error('Installed dependency lockfile differs from the committed snapshot.');
}
try { await symlink(path.join(root, 'node_modules'), path.join(snapshot, 'node_modules'), 'junction'); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
execFileSync(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build'], { cwd: snapshot, stdio: 'inherit' });
const dist = path.join(snapshot, 'dist');
const release = path.join(root, '.release-static', commit);
await mkdir(release, { recursive: true });
await cp(dist, release, { recursive: true });
await cp(path.join(snapshot, 'deployment/Dockerfile'), path.join(release, 'Dockerfile'));
const artifacts = {};
async function record(dir, prefix = '') {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const name = prefix + item.name;
    if (item.isDirectory()) await record(path.join(dir, item.name), name + '/');
    else artifacts[name] = createHash('sha256').update(await readFile(path.join(dir, item.name))).digest('hex');
  }
}
await record(dist);
await writeFile(path.join(release, 'release.json'), JSON.stringify({ commit, builtAt: new Date().toISOString(), artifacts }, null, 2) + '\n');
console.log(JSON.stringify({ commit, release, staticFiles: Object.keys(artifacts).length }));
