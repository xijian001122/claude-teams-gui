#!/usr/bin/env node
/**
 * Build server with esbuild - handles path aliases and ESM correctly
 */
import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'fs';

const result = await build({
  entryPoints: ['src/server/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist/server',
  // Preserve directory structure for non-bundled external packages
  packages: 'external',
  // Path alias resolution
  alias: {
    '@shared': './src/shared',
  },
  // No banner - shebang causes ESM parse error
  // Source maps for debugging
  sourcemap: true,
  // Minification off for readability
  minify: false,
  // Copy static files after build
}).then(() => {
  // Copy necessary static files
  mkdirSync('dist/server/db', { recursive: true });
  cpSync('src/server/db/schema.sql', 'dist/server/db/schema.sql');

  // Copy package.json for ESM
  cpSync('src/server/package.json', 'dist/server/package.json');

  console.log('Server build complete!');
});
