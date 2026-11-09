import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const normalize = (text) => text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const hash = (text) => createHash('sha256').update(text).digest('hex');

export function checkContract(projectPath) {
  const project = resolve(projectPath);
  const snapshotPath = join(project, 'src/types/chartPlugin.d.ts');
  const sourcePath = join(project, 'prebuild/api/chartPlugin.d.ts');
  const versionPath = join(project, 'prebuild/api/version.json');
  const missing = [sourcePath, versionPath].filter((file) => !existsSync(file));
  if (missing.length) {
    return {
      status: 'unavailable',
      exitCode: 2,
      project,
      missing,
      snapshotAvailable: existsSync(snapshotPath),
      message: 'Источник ядра недоступен; актуальность снимка не проверена.',
    };
  }
  const snapshot = normalize(readFileSync(snapshotPath, 'utf8'));
  const source = normalize(readFileSync(sourcePath, 'utf8'));
  const versions = JSON.parse(readFileSync(versionPath, 'utf8').replace(/^\uFEFF/, ''));
  if (typeof versions.contractVersion !== 'string' || typeof versions.coreVersion !== 'string') {
    throw new Error('version.json должен содержать строки contractVersion и coreVersion.');
  }
  // Убирается только явно распознанная шапка копии, не произвольный первый комментарий.
  const firstComment = snapshot.match(/^\/\*\*[\s\S]*?\*\//)?.[0];
  const isCopyHeader = firstComment && /КОПИЯ контракта ядра ModusBI/.test(firstComment);
  const header = isCopyHeader ? firstComment : '';
  const body = header ? snapshot.slice(header.length).replace(/^\n+/, '') : snapshot;
  const headerVersions = {
    contractVersion: header.match(/contractVersion:\s*([^\s*]+)/)?.[1] ?? null,
    coreVersion: header.match(/coreVersion:\s*([^\s*]+)/)?.[1] ?? null,
  };
  const bodyMatches = body === source;
  const versionsMatch =
    headerVersions.contractVersion === versions.contractVersion && headerVersions.coreVersion === versions.coreVersion;
  let firstDifferentBodyLine = null;
  if (!bodyMatches) {
    const a = body.split('\n');
    const b = source.split('\n');
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i += 1) {
      if (a[i] !== b[i]) {
        firstDifferentBodyLine = i + 1;
        break;
      }
    }
  }
  return {
    status: bodyMatches && versionsMatch ? 'match' : 'different',
    exitCode: bodyMatches && versionsMatch ? 0 : 1,
    project,
    bodyMatches,
    versionsMatch,
    headerRecognized: Boolean(header),
    sourceVersions: { contractVersion: versions.contractVersion, coreVersion: versions.coreVersion },
    snapshotVersions: headerVersions,
    firstDifferentBodyLine,
    sourceBodySha256: hash(source),
    snapshotBodySha256: hash(body),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node check-contract.mjs <project-root>');
    const result = checkContract(process.argv[2]);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.exitCode;
  } catch (error) {
    console.error(JSON.stringify({ status: 'error', message: error.message }));
    process.exitCode = 1;
  }
}
