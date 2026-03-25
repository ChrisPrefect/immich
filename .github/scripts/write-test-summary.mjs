import { readFileSync, appendFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    json: { type: "string" },
    name: { type: "string" },
    framework: { type: "string", default: "vitest" },
    coverage: { type: "string" },
    "pr-comment": { type: "boolean", default: false },
    "artifacts-dir": { type: "string" },
  },
});

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

function formatDuration(milliseconds) {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
}

function parseVitestResults(data) {
  const startTime = data.startTime ?? 0;
  const endTime = Math.max(
    ...(data.testResults ?? []).map((r) => r.endTime ?? 0),
    startTime,
  );

  return {
    total: data.numTotalTests ?? 0,
    passed: data.numPassedTests ?? 0,
    failed: data.numFailedTests ?? 0,
    skipped: data.numPendingTests ?? 0,
    flaky: 0,
    duration: endTime - startTime,
    success: data.success ?? false,
  };
}

function parsePlaywrightResults(data) {
  const stats = data.stats ?? {};
  const passed = stats.expected ?? 0;
  const failed = stats.unexpected ?? 0;
  const flaky = stats.flaky ?? 0;
  const skipped = stats.skipped ?? 0;

  return {
    total: passed + failed + flaky + skipped,
    passed,
    failed,
    skipped,
    flaky,
    duration: stats.duration ?? 0,
    success: failed === 0,
  };
}

function parseCoverageSummary(data) {
  const total = data.total ?? {};

  const files = [];
  for (const [filePath, entry] of Object.entries(data)) {
    if (filePath === "total") {
      continue;
    }
    files.push({
      file: filePath.replace(/^.*?\/src\//, "src/"),
      lines: entry.lines?.pct ?? 0,
      branches: entry.branches?.pct ?? 0,
      functions: entry.functions?.pct ?? 0,
      statements: entry.statements?.pct ?? 0,
    });
  }
  files.sort((a, b) => a.lines - b.lines);

  return {
    lines: total.lines?.pct ?? 0,
    branches: total.branches?.pct ?? 0,
    functions: total.functions?.pct ?? 0,
    statements: total.statements?.pct ?? 0,
    files,
  };
}

function buildMarkdown(name, results, coverage) {
  const statusIcon =
    results.failed > 0
      ? "\u274c"
      : results.flaky > 0
        ? "\u26a0\ufe0f"
        : "\u2705";
  const lines = [];

  lines.push(`### ${statusIcon} ${name}`);
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(`| Total | ${results.total} |`);
  lines.push(`| Passed | ${results.passed} |`);
  lines.push(`| Failed | ${results.failed} |`);
  lines.push(`| Skipped | ${results.skipped} |`);
  if (results.flaky > 0) {
    lines.push(`| Flaky | ${results.flaky} |`);
  }
  lines.push(`| Duration | ${formatDuration(results.duration)} |`);
  lines.push("");

  if (coverage) {
    lines.push("#### Coverage");
    lines.push("");
    lines.push("| Metric | Coverage |");
    lines.push("|--------|----------|");
    lines.push(`| Lines | ${coverage.lines}% |`);
    lines.push(`| Branches | ${coverage.branches}% |`);
    lines.push(`| Functions | ${coverage.functions}% |`);
    lines.push(`| Statements | ${coverage.statements}% |`);
    lines.push("");

    if (coverage.files?.length > 0) {
      lines.push("<details>");
      lines.push(
        `<summary>File coverage (${coverage.files.length} files)</summary>`,
      );
      lines.push("");
      lines.push("| File | Lines | Branches | Functions |");
      lines.push("|------|-------|----------|-----------|");
      for (const file of coverage.files) {
        lines.push(
          `| ${file.file} | ${file.lines}% | ${file.branches}% | ${file.functions}% |`,
        );
      }
      lines.push("");
      lines.push("</details>");
      lines.push("");
    }
  }

  return lines.join("\n");
}

const ARTIFACT_CONFIGS = [
  {
    pattern: "report-server-unit",
    name: "Server Unit Tests",
    framework: "vitest",
    testFile: "test-results.json",
    coverageFile: "coverage/coverage-summary.json",
  },
  {
    pattern: "report-web-unit",
    name: "Web Unit Tests",
    framework: "vitest",
    testFile: "test-results.json",
    coverageFile: "coverage/coverage-summary.json",
  },
  {
    pattern: "report-server-medium",
    name: "Server Medium Tests",
    framework: "vitest",
    testFile: "test-results-medium.json",
    coverageFile: "coverage/coverage-summary.json",
  },
  {
    pattern: "report-cli-unit",
    name: "CLI Unit Tests",
    framework: "vitest",
    testFile: "test-results.json",
    coverageFile: undefined,
  },
  {
    pattern: "report-cli-unit-win",
    name: "CLI Unit Tests (Windows)",
    framework: "vitest",
    testFile: "test-results.json",
    coverageFile: undefined,
  },
  {
    pattern: "report-e2e-server-cli-",
    name: "E2E Server & CLI",
    framework: "vitest",
    testFile: "test-results.json",
    coverageFile: undefined,
  },
  {
    pattern: "report-e2e-server-maintenance-",
    name: "E2E Server Maintenance",
    framework: "vitest",
    testFile: "test-results.json",
    coverageFile: undefined,
  },
  {
    pattern: "report-e2e-web-",
    name: "E2E Web",
    framework: "playwright",
    testFile: "test-results.json",
    coverageFile: undefined,
  },
  {
    pattern: "report-e2e-web-ui-",
    name: "E2E Web UI",
    framework: "playwright",
    testFile: "test-results.json",
    coverageFile: undefined,
  },
  {
    pattern: "report-e2e-web-maintenance-",
    name: "E2E Web Maintenance",
    framework: "playwright",
    testFile: "test-results.json",
    coverageFile: undefined,
  },
];

function getStatusIcon(results) {
  if (results.failed > 0) {
    return "\u274c";
  }
  if (results.flaky > 0) {
    return "\u26a0\ufe0f";
  }
  return "\u2705";
}

function discoverArtifacts(artifactsDir) {
  const dirs = readdirSync(artifactsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const suites = [];

  for (const dir of dirs) {
    const config = ARTIFACT_CONFIGS.find((c) => dir.startsWith(c.pattern));
    if (!config) {
      continue;
    }

    const suffix = dir.slice(config.pattern.length);
    const displayName = suffix ? `${config.name} (${suffix})` : config.name;

    const testFilePath = join(artifactsDir, dir, config.testFile);
    const testData = readJson(testFilePath);
    if (!testData) {
      continue;
    }

    const results =
      config.framework === "playwright"
        ? parsePlaywrightResults(testData)
        : parseVitestResults(testData);

    let coverage;
    if (config.coverageFile) {
      const coveragePath = join(artifactsDir, dir, config.coverageFile);
      const coverageData = readJson(coveragePath);
      if (coverageData) {
        coverage = parseCoverageSummary(coverageData);
      }
    }

    suites.push({ name: displayName, results, coverage });
  }

  return suites;
}

function buildPrComment(suites) {
  if (suites.length === 0) {
    return "## Test Report\n\nNo test results found.\n";
  }

  const lines = [];
  const totalFailed = suites.reduce((s, r) => s + r.results.failed, 0);
  const totalFlaky = suites.reduce((s, r) => s + r.results.flaky, 0);
  const overallIcon =
    totalFailed > 0 ? "\u274c" : totalFlaky > 0 ? "\u26a0\ufe0f" : "\u2705";

  lines.push(`## ${overallIcon} Test Report`);
  lines.push("");
  lines.push("| Suite | Tests | Passed | Failed | Skipped | Duration |");
  lines.push("|-------|------:|-------:|-------:|--------:|---------:|");

  for (const suite of suites) {
    const { results } = suite;
    const icon = getStatusIcon(results);
    const flaky = results.flaky > 0 ? ` (${results.flaky} flaky)` : "";
    lines.push(
      `| ${icon} ${suite.name} | ${results.total} | ${results.passed} | ${results.failed}${flaky} | ${results.skipped} | ${formatDuration(results.duration)} |`,
    );
  }
  lines.push("");

  const suitesWithCoverage = suites.filter((s) => s.coverage);
  if (suitesWithCoverage.length > 0) {
    lines.push("### Coverage");
    lines.push("");
    lines.push("| Suite | Lines | Branches | Functions | Statements |");
    lines.push("|-------|------:|---------:|----------:|-----------:|");

    for (const suite of suitesWithCoverage) {
      const c = suite.coverage;
      lines.push(
        `| ${suite.name} | ${c.lines}% | ${c.branches}% | ${c.functions}% | ${c.statements}% |`,
      );
    }
    lines.push("");

    const allFiles = suitesWithCoverage.flatMap(
      (s) =>
        s.coverage.files?.map((f) => ({
          ...f,
          suite: s.name,
        })) ?? [],
    );

    if (allFiles.length > 0) {
      lines.push("<details>");
      lines.push(`<summary>File coverage (${allFiles.length} files)</summary>`);
      lines.push("");

      for (const suite of suitesWithCoverage) {
        if (!suite.coverage.files?.length) {
          continue;
        }
        lines.push(`#### ${suite.name}`);
        lines.push("");
        lines.push("| File | Lines | Branches | Functions |");
        lines.push("|------|------:|---------:|----------:|");
        for (const file of suite.coverage.files) {
          lines.push(
            `| ${file.file} | ${file.lines}% | ${file.branches}% | ${file.functions}% |`,
          );
        }
        lines.push("");
      }

      lines.push("</details>");
      lines.push("");
    }
  }

  return lines.join("\n");
}

if (values["pr-comment"]) {
  const artifactsDir = values["artifacts-dir"];
  if (!artifactsDir || !existsSync(artifactsDir)) {
    console.error(`Artifacts directory not found: ${artifactsDir}`);
    process.exit(1);
  }

  const suites = discoverArtifacts(artifactsDir);
  const markdown = buildPrComment(suites);
  process.stdout.write(markdown);
} else {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) {
    console.error("GITHUB_STEP_SUMMARY is not set");
    process.exit(1);
  }

  const testData = readJson(values.json);
  if (!testData) {
    const fallback = `### \u26a0\ufe0f ${values.name}\n\nNo test results found at \`${values.json}\`\n\n`;
    appendFileSync(summaryFile, fallback);
    process.exit(0);
  }

  const results =
    values.framework === "playwright"
      ? parsePlaywrightResults(testData)
      : parseVitestResults(testData);

  const coverageData = values.coverage ? readJson(values.coverage) : undefined;
  const coverage = coverageData
    ? parseCoverageSummary(coverageData)
    : undefined;

  const markdown = buildMarkdown(values.name, results, coverage);
  appendFileSync(summaryFile, markdown);
}
