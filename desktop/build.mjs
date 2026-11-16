// node desktop/build.mjs [--stage-only]
// Builds the Windows version of the game:
//   1. stages the app (game page with the font bundled, main.js, preload.js, icon) in .build/app
//   2. downloads the matching Electron for Windows (cached in .cache)
//   3. puts the app inside it, renames the exe, sets its icon and version
//   4. zips it to dist/AfterschoolDeadline-<version>-win-x64.zip
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(DIR, 'package.json'), 'utf8'));
const ELECTRON = pkg.devDependencies.electron;
const VERSION = pkg.version;
const EXE = 'AfterschoolDeadline.exe';
const stageOnly = process.argv.includes('--stage-only');
const step = (m) => console.log('• ' + m);
const rm = (p) => fs.rmSync(p, { recursive: true, force: true });

// ---------- 1. stage the app ----------
const APP = path.join(DIR, '.build', 'app');
rm(APP); fs.mkdirSync(path.join(APP, 'fonts'), { recursive: true });
let html = fs.readFileSync(path.join(DIR, '..', 'game', 'houkago-deadline.html'), 'utf8');
const fontLink = /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=DotGothic16[^>]*>/;
if (!fontLink.test(html)) throw new Error('the Google Fonts link was not found in the game page; update build.mjs');
html = html.replace(fontLink,
  `<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:">\n` +
  `<style>@font-face{font-family:"DotGothic16";src:url("fonts/DotGothic16-Regular.ttf") format("truetype");font-display:swap}</style>`);
fs.writeFileSync(path.join(APP, 'index.html'), html);
for (const f of ['main.js', 'preload.js']) fs.copyFileSync(path.join(DIR, f), path.join(APP, f));
fs.copyFileSync(path.join(DIR, 'assets', 'icon.png'), path.join(APP, 'icon.png'));
for (const f of ['DotGothic16-Regular.ttf', 'OFL.txt']) fs.copyFileSync(path.join(DIR, 'assets', 'fonts', f), path.join(APP, 'fonts', f));
fs.writeFileSync(path.join(APP, 'package.json'), JSON.stringify({ name: pkg.name, productName: pkg.productName, version: VERSION, main: 'main.js' }, null, 2));
step('staged the app in ' + path.relative(process.cwd(), APP));
if (stageOnly) process.exit(0);

// ---------- 2. Electron for Windows ----------
const CACHE = path.join(DIR, '.cache'); fs.mkdirSync(CACHE, { recursive: true });
const zipName = `electron-v${ELECTRON}-win32-x64.zip`, zipPath = path.join(CACHE, zipName);
if (!fs.existsSync(zipPath)) {
  step('downloading ' + zipName);
  execFileSync('curl', ['-sS', '-fL', '--retry', '3', '-o', zipPath + '.part', `https://github.com/electron/electron/releases/download/v${ELECTRON}/${zipName}`], { stdio: 'inherit' });
  fs.renameSync(zipPath + '.part', zipPath);
}

// ---------- 3. assemble ----------
const OUT = path.join(DIR, '.build', 'win', 'AfterschoolDeadline');
rm(path.dirname(OUT)); fs.mkdirSync(OUT, { recursive: true });
execFileSync('unzip', ['-q', zipPath, '-d', OUT]);
rm(path.join(OUT, 'resources', 'default_app.asar'));
fs.cpSync(APP, path.join(OUT, 'resources', 'app'), { recursive: true });
fs.renameSync(path.join(OUT, 'electron.exe'), path.join(OUT, EXE));
fs.renameSync(path.join(OUT, 'LICENSE'), path.join(OUT, 'LICENSE.electron.txt'));
fs.copyFileSync(path.join(DIR, 'assets', 'fonts', 'OFL.txt'), path.join(OUT, 'LICENSE.DotGothic16.txt'));
step('assembled the Windows app');

// icon and version information inside the exe (pure JavaScript, no Windows tools needed)
const ResEdit = await import('resedit');
const exePath = path.join(OUT, EXE);
const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
const res = ResEdit.NtExecutableResource.from(exe);
const icon = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(DIR, 'assets', 'icon.ico')));
const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
const g = groups[0] || { id: 1, lang: 1033 };
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, g.id, g.lang, icon.icons.map((i) => i.data));
const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0];
const lang = vi.getAllLanguagesForStringValues()[0] || { lang: 1033, codepage: 1200 };
const [a, b, c] = VERSION.split('.').map(Number);
vi.setFileVersion(a, b, c, 0, lang.lang); vi.setProductVersion(a, b, c, 0, lang.lang);
vi.setStringValues(lang, { ProductName: pkg.productName, FileDescription: pkg.productName, InternalName: pkg.productName, OriginalFilename: EXE, CompanyName: '', LegalCopyright: '', FileVersion: VERSION, ProductVersion: VERSION });
vi.outputToResourceEntries(res.entries);
res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));
step('set the icon and version of ' + EXE);

// ---------- 4. zip ----------
const DIST = path.join(DIR, 'dist'); fs.mkdirSync(DIST, { recursive: true });
const zipOut = path.join(DIST, `AfterschoolDeadline-${VERSION}-win-x64.zip`); rm(zipOut);
execFileSync('zip', ['-qr', '-9', zipOut, 'AfterschoolDeadline'], { cwd: path.dirname(OUT) });
step(`done: ${path.relative(process.cwd(), zipOut)} (${(fs.statSync(zipOut).size / 1048576).toFixed(1)} MB)`);
