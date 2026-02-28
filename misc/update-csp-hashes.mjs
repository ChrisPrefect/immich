#!/usr/bin/env node

/**
 * Computes SHA-256 hashes for inline <script> elements in app.html
 * and updates the script-src CSP directive in svelte.config.js.
 *
 * SvelteKit's CSP hash mode only hashes inline content it generates itself,
 * not the template content from app.html. This script fills that gap.
 *
 * Run this script whenever the inline scripts in app.html change.
 *
 * Usage: node misc/update-csp-hashes.mjs
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDirectory, '..');
const appHtmlPath = join(repoRoot, 'web', 'src', 'app.html');
const configPath = join(repoRoot, 'web', 'svelte.config.js');

const appHtml = readFileSync(appHtmlPath, 'utf-8');
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;

const hashes = [];
let match;
while ((match = scriptRegex.exec(appHtml)) !== null) {
  const content = match[1];
  const hash = createHash('sha256').update(content).digest('base64');
  hashes.push(`sha256-${hash}`);
  const preview = content.trim().slice(0, 60).replaceAll('\n', ' ');
  console.log(`Found: ${preview}...`);
  console.log(`  Hash: sha256-${hash}`);
  console.log();
}

if (hashes.length === 0) {
  console.log('No inline <script> elements found in app.html');
  process.exit(0);
}

let config = readFileSync(configPath, 'utf-8');

const scriptSrcRegex = /'script-src':\s*\[[\s\S]*?\]/;
const scriptSrcMatch = config.match(scriptSrcRegex);
if (!scriptSrcMatch) {
  console.error("Could not find 'script-src' directive in svelte.config.js");
  process.exit(1);
}

const existingEntries = [];
const entryRegex = /'([^']+)'/g;
let entryMatch;
while ((entryMatch = entryRegex.exec(scriptSrcMatch[0])) !== null) {
  const value = entryMatch[1];
  if (value === 'script-src' || value.startsWith('sha256-')) {
    continue;
  }
  existingEntries.push(value);
}

const allEntries = [...existingEntries, ...hashes];
const formatted = allEntries.map((entry) => `          '${entry}'`).join(',\n');
const newScriptSrc = `'script-src': [\n${formatted},\n        ]`;

config = config.replace(scriptSrcRegex, newScriptSrc);
writeFileSync(configPath, config);

console.log(`Updated svelte.config.js with ${hashes.length} script hash(es)`);
