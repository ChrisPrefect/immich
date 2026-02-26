/**
 * Pixel-level comparison of base vs PR screenshots.
 *
 * Uses pixelmatch to generate diff images and calculate change percentages.
 *
 * Usage:
 *   npx tsx e2e/src/screenshots/compare.ts <base-dir> <pr-dir> <output-dir>
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { PNG } from 'pngjs';

// pixelmatch is a lightweight dependency — use a simple inline implementation
// based on the approach from the pixelmatch library to avoid adding a new dependency.
// The e2e package already has pngjs.

function pixelMatch(
  img1Data: Uint8Array,
  img2Data: Uint8Array,
  diffData: Uint8Array,
  width: number,
  height: number,
): number {
  let diffCount = 0;

  for (let i = 0; i < img1Data.length; i += 4) {
    const r1 = img1Data[i];
    const g1 = img1Data[i + 1];
    const b1 = img1Data[i + 2];

    const r2 = img2Data[i];
    const g2 = img2Data[i + 1];
    const b2 = img2Data[i + 2];

    const dr = Math.abs(r1 - r2);
    const dg = Math.abs(g1 - g2);
    const db = Math.abs(b1 - b2);

    // Threshold: if any channel differs by more than 25, mark as different
    const isDiff = dr > 25 || dg > 25 || db > 25;

    if (isDiff) {
      // Red highlight for diff pixels
      diffData[i] = 255;
      diffData[i + 1] = 0;
      diffData[i + 2] = 0;
      diffData[i + 3] = 255;
      diffCount++;
    } else {
      // Dimmed original for unchanged pixels
      const gray = Math.round(0.299 * r1 + 0.587 * g1 + 0.114 * b1);
      diffData[i] = gray;
      diffData[i + 1] = gray;
      diffData[i + 2] = gray;
      diffData[i + 3] = 128;
    }
  }

  return diffCount;
}

export interface ComparisonResult {
  name: string;
  baseExists: boolean;
  prExists: boolean;
  diffPixels: number;
  totalPixels: number;
  changePercent: number;
  diffImagePath: string | null;
  baseImagePath: string | null;
  prImagePath: string | null;
}

export function compareScreenshots(baseDir: string, prDir: string, outputDir: string): ComparisonResult[] {
  mkdirSync(outputDir, { recursive: true });

  // Collect all screenshot names from both directories
  const baseFiles = existsSync(baseDir)
    ? new Set(readdirSync(baseDir).filter((f) => f.endsWith('.png')))
    : new Set<string>();
  const prFiles = existsSync(prDir)
    ? new Set(readdirSync(prDir).filter((f) => f.endsWith('.png')))
    : new Set<string>();

  const allNames = new Set([...baseFiles, ...prFiles]);
  const results: ComparisonResult[] = [];

  for (const fileName of [...allNames].sort()) {
    const name = basename(fileName, '.png');
    const basePath = join(baseDir, fileName);
    const prPath = join(prDir, fileName);
    const baseExists = baseFiles.has(fileName);
    const prExists = prFiles.has(fileName);

    if (!baseExists || !prExists) {
      // New or removed page
      results.push({
        name,
        baseExists,
        prExists,
        diffPixels: -1,
        totalPixels: -1,
        changePercent: 100,
        diffImagePath: null,
        baseImagePath: baseExists ? basePath : null,
        prImagePath: prExists ? prPath : null,
      });
      continue;
    }

    // Load both PNGs
    const basePng = PNG.sync.read(readFileSync(basePath));
    const prPng = PNG.sync.read(readFileSync(prPath));

    // Handle size mismatches by comparing the overlapping region
    const width = Math.max(basePng.width, prPng.width);
    const height = Math.max(basePng.height, prPng.height);

    // Resize images to the same dimensions (pad with transparent)
    const normalizedBase = normalizeImage(basePng, width, height);
    const normalizedPr = normalizeImage(prPng, width, height);

    const diffPng = new PNG({ width, height });
    const totalPixels = width * height;
    const diffPixels = pixelMatch(
      normalizedBase,
      normalizedPr,
      diffPng.data as unknown as Uint8Array,
      width,
      height,
    );

    const diffImagePath = join(outputDir, `${name}-diff.png`);
    writeFileSync(diffImagePath, PNG.sync.write(diffPng));

    results.push({
      name,
      baseExists,
      prExists,
      diffPixels,
      totalPixels,
      changePercent: totalPixels > 0 ? (diffPixels / totalPixels) * 100 : 0,
      diffImagePath,
      baseImagePath: basePath,
      prImagePath: prPath,
    });
  }

  return results;
}

function normalizeImage(png: PNG, targetWidth: number, targetHeight: number): Uint8Array {
  if (png.width === targetWidth && png.height === targetHeight) {
    return png.data as unknown as Uint8Array;
  }

  const data = new Uint8Array(targetWidth * targetHeight * 4);
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const targetIdx = (y * targetWidth + x) * 4;
      if (x < png.width && y < png.height) {
        const sourceIdx = (y * png.width + x) * 4;
        data[targetIdx] = png.data[sourceIdx];
        data[targetIdx + 1] = png.data[sourceIdx + 1];
        data[targetIdx + 2] = png.data[sourceIdx + 2];
        data[targetIdx + 3] = png.data[sourceIdx + 3];
      } else {
        // Transparent padding
        data[targetIdx + 3] = 0;
      }
    }
  }
  return data;
}

/** Generate a markdown report for PR comment. */
export function generateMarkdownReport(results: ComparisonResult[], artifactUrl: string): string {
  const changed = results.filter((r) => r.changePercent > 0.1);
  const unchanged = results.filter((r) => r.changePercent <= 0.1);

  if (changed.length === 0) {
    return '## Visual Review\n\nNo visual changes detected in the affected pages.';
  }

  let md = '## Visual Review\n\n';
  md += `Found **${changed.length}** page(s) with visual changes`;
  if (unchanged.length > 0) {
    md += ` (${unchanged.length} unchanged)`;
  }
  md += '.\n\n';

  for (const result of changed) {
    md += `### ${result.name}\n\n`;

    if (!result.baseExists) {
      md += '**New page** (no base screenshot to compare)\n\n';
      md += `| PR |\n|---|\n| ![${result.name} PR](${artifactUrl}/${result.name}.png) |\n\n`;
      continue;
    }

    if (!result.prExists) {
      md += '**Removed page** (no PR screenshot)\n\n';
      continue;
    }

    md += `Change: **${result.changePercent.toFixed(1)}%** (${result.diffPixels.toLocaleString()} pixels)\n\n`;
    md += '| Base | PR | Diff |\n';
    md += '|------|-------|------|\n';
    md += `| ![base](${artifactUrl}/base/${result.name}.png) `;
    md += `| ![pr](${artifactUrl}/pr/${result.name}.png) `;
    md += `| ![diff](${artifactUrl}/diff/${result.name}-diff.png) |\n\n`;
  }

  if (unchanged.length > 0) {
    md += '<details>\n<summary>Unchanged pages</summary>\n\n';
    for (const result of unchanged) {
      md += `- ${result.name}\n`;
    }
    md += '\n</details>\n';
  }

  return md;
}

// CLI usage
if (process.argv[1]?.endsWith('compare.ts') || process.argv[1]?.endsWith('compare.js')) {
  const [baseDir, prDir, outputDir] = process.argv.slice(2);

  if (!baseDir || !prDir || !outputDir) {
    console.log('Usage: compare.ts <base-dir> <pr-dir> <output-dir>');
    process.exit(1);
  }

  const results = compareScreenshots(
    resolve(baseDir),
    resolve(prDir),
    resolve(outputDir),
  );

  console.log('\nComparison Results:');
  console.log('==================');
  for (const r of results) {
    const status = r.changePercent > 0.1 ? 'CHANGED' : 'unchanged';
    console.log(`  ${r.name}: ${status} (${r.changePercent.toFixed(1)}%)`);
  }

  const report = generateMarkdownReport(results, '.');
  const reportPath = join(resolve(outputDir), 'report.md');
  writeFileSync(reportPath, report);
  console.log(`\nReport written to: ${reportPath}`);

  // Also output results as JSON for CI
  const jsonPath = join(resolve(outputDir), 'results.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Results JSON written to: ${jsonPath}`);
}
