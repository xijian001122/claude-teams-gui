#!/usr/bin/env node
/**
 * Sync version from package.json to plugin.json and marketplace.json
 * Run after npm version to keep all version numbers in sync
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Read version from package.json
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version;

console.log(`Syncing version ${version} to plugin configs...`);

// Update plugin.json
const pluginPath = join(rootDir, '.claude-plugin', 'plugin.json');
const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'));
plugin.version = version;
writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + '\n');
console.log(`  ✓ Updated .claude-plugin/plugin.json`);

// Update marketplace.json
const marketplacePath = join(rootDir, '.claude-plugin', 'marketplace.json');
const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf8'));
if (marketplace.plugins && marketplace.plugins[0]) {
  marketplace.plugins[0].version = version;
  writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n');
  console.log(`  ✓ Updated .claude-plugin/marketplace.json`);
}

console.log(`Version sync complete!`);
