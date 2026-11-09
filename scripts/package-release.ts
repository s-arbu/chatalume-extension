import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { checkRelease } from './check-release';

const version = checkRelease();
mkdirSync('out', { recursive: true });
const archive = `out/chatalume-v${version}.zip`;
const temporaryArchive = `${archive}.tmp`;
const result = Bun.spawnSync(['python3', '-c', `
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys
with ZipFile(sys.argv[1], 'w', ZIP_DEFLATED) as archive:
    for file in sorted(Path('dist').rglob('*')):
        if file.is_file(): archive.write(file, file.relative_to('dist'))
with ZipFile(sys.argv[1]) as archive:
    assert archive.testzip() is None
`, temporaryArchive], { stdout: 'inherit', stderr: 'inherit' });
if (result.exitCode !== 0) {
  rmSync(temporaryArchive, { force: true });
  process.exit(result.exitCode);
}
renameSync(temporaryArchive, archive);
const sha256 = createHash('sha256').update(readFileSync(archive)).digest('hex');
writeFileSync(`${archive}.sha256`, `${sha256}  ${basename(archive)}\n`);
console.log(`Packaged ${archive}\nSHA-256: ${sha256}`);
