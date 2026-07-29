import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const ignoredDirectories = new Set([
  '.git',
  'node_modules',
  'playwright-report',
  'test-results'
]);
const localAssetReference = /\b(?:src|href)\s*=\s*(["'])([^"'?#]+?\.(?:css|js))(?:\?[^"']*)?\1/g;

const listHtmlFiles = async (directory = root) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...await listHtmlFiles(join(directory, entry.name)));
      }
    } else if (entry.name.endsWith('.html')) {
      files.push(join(directory, entry.name));
    }
  }

  return files;
};

const hashFile = async (path) => createHash('sha256')
  .update(await readFile(path))
  .digest('hex')
  .slice(0, 12);

const resolveAsset = (htmlPath, reference) => {
  if (/^(?:[a-z]+:)?\/\//i.test(reference) || reference.startsWith('data:')) {
    return null;
  }

  return reference.startsWith('/')
    ? join(root, reference.slice(1))
    : resolve(dirname(htmlPath), reference);
};

const synchronizeFile = async (htmlPath) => {
  const source = await readFile(htmlPath, 'utf8');
  const replacements = [];

  for (const match of source.matchAll(localAssetReference)) {
    const [referenceWithAttribute, quote, reference] = match;
    const assetPath = resolveAsset(htmlPath, reference);
    if (!assetPath || !existsSync(assetPath)) continue;

    const version = await hashFile(assetPath);
    const replacement = referenceWithAttribute.replace(
      `${quote}${referenceWithAttribute.slice(referenceWithAttribute.indexOf(quote) + 1, -1)}${quote}`,
      `${quote}${reference}?v=${version}${quote}`
    );
    if (replacement !== referenceWithAttribute) {
      replacements.push({
        start: match.index,
        end: match.index + referenceWithAttribute.length,
        value: replacement
      });
    }
  }

  if (!replacements.length) return { source, result: source };

  let result = source;
  replacements.reverse().forEach(({ start, end, value }) => {
    result = `${result.slice(0, start)}${value}${result.slice(end)}`;
  });
  return { source, result };
};

const htmlFiles = await listHtmlFiles();
const staleFiles = [];

for (const htmlPath of htmlFiles) {
  const { source, result } = await synchronizeFile(htmlPath);
  if (source === result) continue;

  staleFiles.push(htmlPath.slice(root.length + 1));
  if (!checkOnly) await writeFile(htmlPath, result);
}

if (checkOnly && staleFiles.length) {
  console.error(`Asset versions are stale:\n- ${staleFiles.join('\n- ')}`);
  process.exitCode = 1;
} else if (checkOnly) {
  console.log(`Asset versions are current in ${htmlFiles.length} HTML files.`);
} else {
  console.log(`Updated asset versions in ${staleFiles.length} HTML files.`);
}
