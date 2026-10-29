import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

function liveVersionJsonPlugin(): Plugin {
  return {
    name: 'live-version-json',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.split('?')[0]?.endsWith('/version.json')) {
          try {
            const pkgPath = path.resolve(process.cwd(), 'package.json');
            const verPath = path.resolve(process.cwd(), 'public/version.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
              version?: string;
            };
            const rawVersion = pkg.version || '0.1.0';
            const version = rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`;

            let existingBuildVersion = `arrovian-atropos-${version}`;
            if (fs.existsSync(verPath)) {
              const verData = JSON.parse(fs.readFileSync(verPath, 'utf-8')) as {
                version?: string;
                buildVersion?: string;
              };
              if (verData.version === version && verData.buildVersion) {
                existingBuildVersion = verData.buildVersion;
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.end(
              JSON.stringify({
                name: 'Arrovian Atropos PWA',
                version,
                buildVersion: existingBuildVersion,
                timestamp: Date.now(),
              })
            );
            return;
          } catch {
            // Fall through to static file serving
          }
        }
        next();
      });
    },
  };
}

const base = process.env.GITHUB_PAGES === 'true' ? '/arrovian-atropos/' : '/';

export default defineConfig({
  base,
  plugins: [
    liveVersionJsonPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Arrovian Atropos — Hidden Dictator Game',
        short_name: 'Arrovian Atropos',
        description:
          "Interactive combinatorial game unifying Burke & Teng's Atropos with Sperner's Lemma and Arrow's Impossibility Theorem.",
        theme_color: '#090d16',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'any',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/version.json'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/version\.json/],
        runtimeCaching: [
          {
            urlPattern: /version\.json(\?.*)?$/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
