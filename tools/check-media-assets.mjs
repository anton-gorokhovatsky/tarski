#!/usr/bin/env node

import { readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']);
const ASSETS_DIR = 'assets';
const KIB = 1024;

const rules = [
  {
    test: (path) => path.startsWith('assets/artist-index/'),
    label: 'artist image',
    warn: 650 * KIB,
    fail: 900 * KIB
  },
  {
    test: (path) => path === 'assets/og-image.png',
    label: 'sharing image',
    warn: 700 * KIB,
    fail: 1100 * KIB
  },
  {
    test: (path) => path.startsWith('assets/'),
    label: 'site image',
    warn: 500 * KIB,
    fail: 1000 * KIB
  }
];

const formatBytes = (bytes) => `${Math.round(bytes / KIB)} KiB`;

const normalizePath = (path) => path.split(sep).join('/');

const walk = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(path);
    }

    return path;
  });
};

const getRule = (path) => rules.find((rule) => rule.test(path));

const images = walk(ASSETS_DIR)
  .map(normalizePath)
  .filter((path) => IMAGE_EXTENSIONS.has(extname(path).toLowerCase()));

const warnings = [];
const failures = [];

images.forEach((path) => {
  const size = statSync(path).size;
  const rule = getRule(path);

  if (!rule) return;

  const item = {
    path: relative('.', path),
    size,
    rule
  };

  if (size > rule.fail) {
    failures.push(item);
  } else if (size > rule.warn) {
    warnings.push(item);
  }
});

const printItems = (title, items) => {
  if (!items.length) return;

  console.log(title);
  items.forEach(({ path, size, rule }) => {
    console.log(`- ${path}: ${formatBytes(size)} (${rule.label}, target ${formatBytes(rule.warn)}, max ${formatBytes(rule.fail)})`);
  });
};

printItems('Media warnings:', warnings);
printItems('Media failures:', failures);

if (failures.length) {
  process.exitCode = 1;
} else {
  console.log(`Media check passed: ${images.length} images scanned.`);
}
