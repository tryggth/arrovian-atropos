import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PKG_PATH = path.join(__dirname, 'package.json');
const VERSION_PATH = path.join(__dirname, 'public', 'version.json');

export function syncVersionJson() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  const rawVersion = process.env.VITE_APP_VERSION || pkg.version || '0.2.1';
  const version = rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`;
  const timestamp = Date.now();
  const buildNumber = process.env.GITHUB_RUN_NUMBER
    ? Number(process.env.GITHUB_RUN_NUMBER)
    : undefined;

  let commitSha = process.env.GITHUB_SHA
    ? process.env.GITHUB_SHA.slice(0, 7)
    : undefined;
  if (!commitSha) {
    try {
      commitSha = execSync('git rev-parse --short HEAD', {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
    } catch {
      // git not initialized or no commits yet
    }
  }

  const suffixParts = [
    buildNumber !== undefined ? `run${buildNumber}` : null,
    commitSha || null,
    String(timestamp),
  ].filter(Boolean);

  const buildVersion = `arrovian-atropos-${version}-${suffixParts.join('-')}`;

  const payload = {
    name: 'Arrovian Atropos PWA',
    version,
    buildVersion,
    ...(buildNumber !== undefined ? { buildNumber } : {}),
    ...(commitSha ? { commitSha } : {}),
    timestamp,
  };

  fs.mkdirSync(path.dirname(VERSION_PATH), { recursive: true });
  fs.writeFileSync(VERSION_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`[PWA Build] version.json generated -> ${version} (${buildVersion})`);
  return payload;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncVersionJson();
}
