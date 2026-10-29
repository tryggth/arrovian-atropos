#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncVersionJson } from '../update-sw-version.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');

const args = process.argv.slice(2);
const isMinor = args.includes('--minor');
const isMajor = args.includes('--major');
const isCi = args.includes('--ci');

function parseSemver(semverStr) {
  const cleaned = String(semverStr || '0.2.0').replace(/^v/, '');
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return { major: 0, minor: 2, patch: 0 };
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function computeNextVersion(currentVersion) {
  const { major, minor, patch } = parseSemver(currentVersion);
  if (isMajor) return `${major + 1}.0.0`;
  if (isMinor) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export function executeBump() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  const oldVersion = pkg.version || '0.2.0';
  const newVersion = isCi ? oldVersion : computeNextVersion(oldVersion);

  if (newVersion !== oldVersion) {
    pkg.version = newVersion;
    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`[Version Bump] package.json updated: ${oldVersion} -> ${newVersion}`);
  }

  const payload = syncVersionJson();
  return { oldVersion, newVersion, payload };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  executeBump();
}
