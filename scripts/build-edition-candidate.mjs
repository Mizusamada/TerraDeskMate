/**
 * Build one self-contained edition candidate from the canonical D:\桌宠 source.
 *
 * Design reason: program code must be identical across editions while resource
 * policy stays explicit. This script hard-links immutable public assets into a
 * fresh candidate, so it cannot overwrite an old release and does not duplicate
 * tens of gigabytes. It never reads Electron userData or any private profile.
 */
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import {editionPolicy,allowedReleaseFile} from './release-resource-policy.mjs';

const root = path.resolve(process.env.TERRA_CANONICAL_ROOT ?? 'D:/桌宠');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; };
const edition = arg('--edition', 'standard');
const output = path.resolve(arg('--output', path.join(root, '.build', 'edition-candidates', edition)));
const version = arg('--version', '0.3.1');
const electronRoot = path.resolve(arg('--electron-root', path.join(root, 'node_modules/electron/dist')));
// Design reason: Light's canonical 12-model source is deliberately distinct
// from the full library, so an omitted flag cannot silently ship 434 roles.
const assetRoot = path.resolve(arg('--asset-root', path.join(root, 'assets', edition==='light'?'light-builtin':'builtin')));
const speechRootArg = arg('--speech-root', '');
const speechRoot = speechRootArg ? path.resolve(speechRootArg) : '';
const includeSpeech = speechRoot.length > 0;
const allowed = new Set(['full', 'light', 'plus', 'standard']);
if (!allowed.has(edition)) throw new Error(`unknown edition: ${edition}`);
if (fs.existsSync(output)) throw new Error(`refusing to overwrite candidate: ${output}`);
for (const p of [root, electronRoot, assetRoot]) if (!p || !fs.existsSync(p)) throw new Error(`missing build input: ${p}`);
if (includeSpeech !== editionPolicy[edition].speech) throw new Error('speech input violates edition policy');
if (includeSpeech && !fs.existsSync(speechRoot)) throw new Error(`missing speech runtime: ${speechRoot}`);
if(edition==='light'){
 const modelCount=Object.keys(JSON.parse(fs.readFileSync(path.join(assetRoot,'model-catalog.json'),'utf8')).models).length;
 const roleNames=fs.readdirSync(path.join(assetRoot,'干员模型'),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name);
 if(modelCount!==12||roleNames.length!==1||roleNames[0]!=='Amiya')throw new Error('Light asset root must contain only Amiya and 12 models');
}

async function hardlinkTree(from, to, filter = () => true) {
  const stat = fs.lstatSync(from);
  if (stat.isDirectory()) {
    await mkdir(to, { recursive: true });
    for (const name of fs.readdirSync(from)) {
      if (filter(path.join(from, name))) await hardlinkTree(path.join(from, name), path.join(to, name), filter);
    }
    return;
  }
  await mkdir(path.dirname(to), { recursive: true });
  fs.linkSync(from, to);
}
async function copyTree(from, to, filter = () => true) { await hardlinkTree(from, to, filter); }

await mkdir(output, { recursive: true });
// Electron binaries are immutable runtime files; hardlinks reduce disk pressure.
await copyTree(electronRoot, output, (p) => path.basename(p) !== 'electron.exe');
fs.linkSync(path.join(electronRoot, 'electron.exe'), path.join(output, 'TerraDeskMate.exe'));
const app = path.join(output, 'resources', 'app');
await mkdir(path.join(app, 'dist', 'apps', 'desktop', 'renderer'), { recursive: true });
for (const [entry, out, platform, format] of [
  ['main/main.ts', 'main/main.js', 'node', 'esm'],
  ['preload/bridge.ts', 'preload/bridge.cjs', 'node', 'cjs'],
  ['renderer/renderer.ts', 'renderer/renderer.js', 'browser', 'iife'],
]) {
  await build({ entryPoints: [path.join(root, 'apps/desktop/src', entry)], bundle: true, platform, format,
    external: platform === 'node' ? ['electron', 'ws'] : [], outfile: path.join(app, 'dist/apps/desktop', out) });
}
for (const file of ['index.html', 'pet.html', 'enemy.html', 'styles.css', 'industrial.css', 'pcm-worklet.js', 'icon.png']) {
  await copyTree(path.join(root, 'apps/desktop/src/renderer', file), path.join(app, 'dist/apps/desktop/renderer', file));
}
await copyTree(assetRoot, path.join(app, 'dist/assets/builtin'), p=>allowedReleaseFile(path.relative(assetRoot,p),edition));
await mkdir(path.join(app, 'node_modules'), { recursive: true });
await copyTree(path.join(root, 'node_modules/ws'), path.join(app, 'node_modules/ws'));
for (const file of ['train-role.py', 'train-role-batch.py', 'train-gpt-single-gpu.py', 'train-sovits-single-gpu.py']) {
  const from = path.join(root, 'scripts', file); if (fs.existsSync(from)) await copyTree(from, path.join(app, 'dist/training', file));
}
// Internal plans, screenshots, private diagnostics and raw source captures are not public manuals.
// Only explicit license/manual files are copied; product code and userData remain unchanged.
await mkdir(path.join(app,'third_party'), {recursive:true});
const license=path.join(root,'docs/ARKPETS-WEB-LICENSE.txt');
if(fs.existsSync(license)) await copyTree(license,path.join(app,'third_party/ARKPETS-WEB-LICENSE.txt'));
if (includeSpeech) await copyTree(speechRoot, path.join(app, 'speech-runtime'),p=>allowedReleaseFile('speech-runtime/'+path.relative(speechRoot,p),edition));
// Design reason: immutable edition metadata lives with the canonical source,
// so removing old installed edition directories cannot break future builds.
const sourceDistribution = path.join(root,'scripts','distribution-templates',edition+'.json');
const distribution = JSON.parse(fs.readFileSync(sourceDistribution, 'utf8'));
distribution.version = version;
distribution.codeSource = 'D:/桌宠';
distribution.codeBuild = 'canonical-roles-and-stability-'+version;
distribution.editionName = edition;
distribution.includesSharedSpeechRuntime = includeSpeech;
distribution.baseRoles = fs.readdirSync(path.join(assetRoot,'干员模型')).filter(name=>fs.statSync(path.join(assetRoot,'干员模型',name)).isDirectory());
distribution.modelCount = Object.keys(JSON.parse(fs.readFileSync(path.join(assetRoot,'model-catalog.json'),'utf8')).models).length;
distribution.personalDataIncluded = false;
distribution.excludesTestsAndPersonalData = true;
distribution.functionalValidation = 'candidate-pending';
await writeFile(path.join(app, 'distribution.json'), JSON.stringify(distribution, null, 2) + '\n');
const templateSource = path.join(root,'scripts','distribution-templates',edition+'.default-template.json');
if (fs.existsSync(templateSource)) await copyTree(templateSource, path.join(app, 'default-template.json'));
await writeFile(path.join(app, 'package.json'), JSON.stringify({ name: 'terra-desk-mate', version, type: 'module', main: 'dist/apps/desktop/main/main.js' }, null, 2) + '\n');
await writeFile(path.join(output, '启动泰拉桌伴.cmd'), '@echo off\r\nstart "" "%~dp0TerraDeskMate.exe"\r\n', 'utf8');
await writeFile(path.join(output, 'BUILD-MANIFEST.json'), JSON.stringify({ schemaVersion: 1, edition, version, source: 'D:/桌宠', assetRoot, includesSharedSpeechRuntime: includeSpeech, excludesUserData: true, excludes: ['Electron userData', 'API keys', 'chat history', 'long-term memories', 'user imports', 'training caches'], output }, null, 2) + '\n');
console.log(JSON.stringify({ edition, version, output, includeSpeech, assetRoot }, null, 2));

