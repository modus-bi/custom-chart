import { readFileSync, statSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const hash = (data) => createHash('sha256').update(data).digest('hex');
const parseJson = (data) => JSON.parse(data.toString('utf8').replace(/^\uFEFF/, ''));
const ensure = (condition, message) => {
  if (!condition) throw new Error(message);
};

export async function verifyPackage(projectPath, archivePath) {
  const project = resolve(projectPath);
  const archive = resolve(project, archivePath);
  const compressed = readFileSync(archive);
  ensure(compressed[0] === 0x1f && compressed[1] === 0x8b, 'Архив должен быть gzip (.tar.gz).');
  // tar берётся из целевого проекта, не из папки установки скилла; ничего не скачивается.
  const projectRequire = createRequire(join(project, 'package.json'));
  let tar;
  try {
    tar = projectRequire('tar');
  } catch {
    throw new Error('В проекте недоступен пакет tar. Установите зависимости проекта и повторите.');
  }
  const entries = new Map();
  const problems = [];
  await tar.t({
    file: archive,
    strict: true,
    onReadEntry(entry) {
      if (!['plugin.js', 'manifest.json'].includes(entry.path) || entry.type !== 'File') {
        problems.push(`Недопустимая запись архива: ${entry.path} (${entry.type})`);
        entry.resume();
        return;
      }
      if (entries.has(entry.path)) problems.push(`Дубликат в архиве: ${entry.path}`);
      const chunks = [];
      entries.set(entry.path, chunks);
      entry.on('data', (chunk) => chunks.push(chunk));
    },
  });
  ensure(!problems.length, problems.join('; '));
  ensure(entries.size === 2, 'В архиве нужны ровно plugin.js и manifest.json.');
  const plugin = Buffer.concat(entries.get('plugin.js'));
  const manifestBytes = Buffer.concat(entries.get('manifest.json'));
  const manifest = parseJson(manifestBytes);
  ensure(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Манифест должен быть объектом.');
  ensure(
    typeof manifest.name === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(manifest.name),
    'manifest.name должен быть безопасным идентификатором без пути.',
  );
  for (const field of ['version', 'apiVersion', 'description']) {
    ensure(
      typeof manifest[field] === 'string' && manifest[field].trim().length > 0,
      `В манифесте отсутствует непустая строка ${field}.`,
    );
  }
  ensure(basename(archive) === `${manifest.name}.tar.gz`, 'Имя архива не совпадает с manifest.name.');
  ensure(
    Array.isArray(manifest.files) && manifest.files.length === 1 && manifest.files[0].path === 'plugin.js',
    'manifest.files должен описывать только plugin.js.',
  );
  const actions = manifest.files[0].actions;
  ensure(
    Array.isArray(actions) &&
      actions.length === 1 &&
      actions[0].type === 'ReplacementInTheBody' &&
      actions[0].template === 'CustomChartNNN' &&
      actions[0].replacement === '%ClassName%',
    'Неверное правило ReplacementInTheBody.',
  );
  const packageJson = parseJson(readFileSync(join(project, 'package.json')));
  ensure(manifest.version === packageJson.version, 'Версия манифеста отличается от package.json.');
  const currentManifest = readFileSync(join(project, 'build/manifest.json'));
  ensure(manifestBytes.equals(currentManifest), 'В архиве не текущий build/manifest.json.');
  const source = readFileSync(join(project, 'build/custom_chart_0.js'), 'utf8');
  ensure(source.slice(0, 1000).includes('CustomChart0'), 'CustomChart0 не найден в первых 1000 символах сборки.');
  const expected = source.slice(0, 1000).replace(/CustomChart0/g, 'CustomChartNNN') + source.slice(1000);
  ensure(plugin.equals(Buffer.from(expected, 'utf8')), 'plugin.js не соответствует текущей сборке после подстановки.');
  ensure(!expected.includes('CustomChart0'), 'В plugin.js остался CustomChart0; требуется анализ сборки.');
  return {
    status: 'verified-local',
    archive,
    bytes: statSync(archive).size,
    sha256: hash(compressed),
    files: [...entries.keys()].sort(),
    name: manifest.name,
    version: manifest.version,
    apiVersion: manifest.apiVersion,
    currentBuildMatches: true,
    currentManifestMatches: true,
    portalInstallation: 'not-tested',
    reactExternalization: 'inspect-webpack-stats-separately',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: node verify-package.mjs <project-root> <archive>');
    console.log(JSON.stringify(await verifyPackage(process.argv[2], process.argv[3]), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'error', message: error.message }));
    process.exitCode = 1;
  }
}
