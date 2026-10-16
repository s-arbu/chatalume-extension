import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WALLPAPER_PRESETS } from '../src/wallpapers/presets';

export function assertReleaseVersions(packageVersion: string, manifestVersion: string, tag?: string): void {
  if (packageVersion !== manifestVersion) throw new Error('Package and manifest versions must match.');
  if (!/^\d+\.\d+\.\d+$/.test(packageVersion)) throw new Error('Release version must have three numeric components.');
  if (tag !== undefined && tag !== `v${packageVersion}`) throw new Error(`Release tag must be v${packageVersion}.`);
}

export function checkRelease(tag?: string): string {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const sourceManifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
  const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
  assertReleaseVersions(version, sourceManifest.version, tag);
  assertReleaseVersions(version, manifest.version, tag);
  const files = [manifest.action.default_popup, manifest.options_ui.page, manifest.background.service_worker,
    ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap((entry: { js: string[] }) => entry.js),
    ...WALLPAPER_PRESETS.map((preset) => preset.path)];
  for (const file of files) {
    if (typeof file !== 'string' || !existsSync(join('dist', file))) throw new Error(`Missing release file: ${file}`);
  }
  for (const html of ['popup.html', 'toolbar.html']) {
    const source = readFileSync(join('dist', html), 'utf8');
    for (const match of source.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="([^"]+)"/g)) {
      const resource = match[1];
      if (/^(?:https?:|\/\/)/.test(resource)) throw new Error(`Remote UI resource: ${resource}`);
      if (resource.startsWith('data:')) continue;
      if (!existsSync(join('dist', resource.replace(/^\//, '')))) throw new Error(`Missing UI resource: ${resource}`);
    }
  }
  return version;
}

if (import.meta.main) {
  try { console.log(`Verified release v${checkRelease(process.argv[2])}`); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exit(1); }
}
