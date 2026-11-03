import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkRelease } from './check-release';
import { WALLPAPER_PRESETS } from '../src/wallpapers/presets';

const version = checkRelease();
const zipName = `chatalume-v${version}.zip`;
const zip = readFileSync(join('out', zipName));
const sha256 = createHash('sha256').update(zip).digest('hex');
const folder = `chatalume-prerelease-v${version}`;
const target = join('out', folder);
const website = join(target, 'website');
rmSync(target, { recursive: true, force: true });
mkdirSync(join(website, 'assets'), { recursive: true });
mkdirSync(join(website, 'downloads'), { recursive: true });
cpSync('site', website, { recursive: true });
cpSync('docs/prerelease', join(target, 'docs'), { recursive: true });
cpSync(`docs/releases/v${version}.md`, join(target, 'docs', 'release-notes.md'));
cpSync('LICENSE', join(target, 'LICENSE'));
writeFileSync(join(target, zipName), zip);
writeFileSync(join(website, 'downloads', zipName), zip);
cpSync('public/logo.svg', join(website, 'assets', 'logo.svg'));
for (const preset of WALLPAPER_PRESETS) cpSync(join('public', preset.path), join(website, 'assets', `${preset.id}.svg`));
const replacements: Record<string, string> = {
  '__VERSION__': version,
  '__ZIP_NAME__': zipName,
  '__SHA256__': sha256,
  '__SIZE__': `${Math.round(zip.byteLength / 1024)} KiB`
};
for (const file of readdirSync(website).filter(file => file.endsWith('.html'))) {
  let html = readFileSync(join(website, file), 'utf8');
  for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);
  writeFileSync(join(website, file), html);
}
const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
writeFileSync(join(target, 'candidate.json'), JSON.stringify({
  version, status: 'unpublished-candidate', artifact: zipName, bytes: zip.byteLength, sha256,
  tests_this_build: 'not-run', post_design_manual_qa: 'pending', design_signoff: 'pending',
  store_status: 'not-submitted', public_site_url: null, privacy_page: 'website/privacy.html',
  permissions: manifest.permissions, host_permissions: manifest.host_permissions
}, null, 2) + '\n');
writeFileSync(join(target, 'README.md'), `# Chatalume v${version} — prerelease handoff

Local, unpublished candidate. Final design and post-design testing are pending.

- Extension: [${zipName}](${zipName}) — extract this ZIP for Load unpacked.
- Launch page: [website/index.html](website/index.html).
- Privacy draft: [website/privacy.html](website/privacy.html).
- Store copy, install/support guide and final sign-off: [docs/README.md](docs/README.md).
- Exact artifact identity and pending status: [candidate.json](candidate.json).

SHA-256: \`${sha256}\`

No test suite was run by this packaging command. Historical results do not approve this candidate.
Nothing was deployed, submitted or published. Only publish after design and the owner's final sign-off.

The site uses local assets and a matching download. You can open its index.html directly, or serve it locally:

\`python3 -m http.server 4173 --bind 127.0.0.1 --directory ${target}/website\`

The website is an illustrative demo, not the running extension. The inner extension ZIP is the installation artifact.
`);
const archive = join('out', `${folder}.zip`);
const result = Bun.spawnSync(['python3', '-c', `
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys
root = Path(sys.argv[1])
with ZipFile(sys.argv[2], 'w', ZIP_DEFLATED) as archive:
    for file in sorted(root.rglob('*')):
        if file.is_file(): archive.write(file, file.relative_to(root))
`, target, archive], { stdout: 'inherit', stderr: 'inherit' });
if (result.exitCode !== 0) throw new Error('Could not package the prerelease handoff.');
console.log(`Prepared ${archive}\nLaunch page: ${website}/index.html\nSHA-256: ${sha256}\nStatus: design and testing pending; unpublished.`);
