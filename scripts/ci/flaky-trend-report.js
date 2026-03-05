const fs = require('node:fs');
const path = require('node:path');

const inputPath = process.argv[2] || path.join('test-results', 'playwright-report.json');
const outputJsonPath = process.argv[3] || path.join('test-results', 'flaky-trend.json');
const outputMdPath = process.argv[4] || path.join('test-results', 'flaky-trend.md');

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function collectTestsFromSuite(suite, ancestry, bucket) {
  const currentAncestry = [...ancestry, suite.title].filter(Boolean);

  for (const childSuite of suite.suites || []) {
    collectTestsFromSuite(childSuite, currentAncestry, bucket);
  }

  for (const spec of suite.specs || []) {
    const baseTitle = [...currentAncestry, spec.title].filter(Boolean).join(' > ');
    for (const run of spec.tests || []) {
      const results = Array.isArray(run.results) ? run.results : [];
      const failureCount = results.filter((r) => ['failed', 'timedOut', 'interrupted'].includes(r.status)).length;
      const passCount = results.filter((r) => r.status === 'passed').length;
      const skipCount = results.filter((r) => r.status === 'skipped').length;
      const durationMs = results.reduce((sum, r) => sum + safeNumber(r.duration), 0);
      const isFlaky = failureCount > 0 && passCount > 0;
      const title = run.projectName ? `${baseTitle} [${run.projectName}]` : baseTitle;

      bucket.push({
        title,
        outcome: run.status || 'unknown',
        expectedStatus: run.expectedStatus || 'passed',
        runs: results.length,
        passedRuns: passCount,
        failedRuns: failureCount,
        skippedRuns: skipCount,
        isFlaky,
        durationMs,
      });
    }
  }
}

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Playwright Flaky Trend Report');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Source: ${report.sourceFile}`);
  lines.push(`- Total tests: ${report.summary.totalTests}`);
  lines.push(`- Passed: ${report.summary.passed}`);
  lines.push(`- Failed: ${report.summary.failed}`);
  lines.push(`- Flaky: ${report.summary.flaky}`);
  lines.push(`- Skipped: ${report.summary.skipped}`);
  lines.push(`- Pass rate: ${report.summary.passRatePct}%`);
  lines.push(`- Flake rate: ${report.summary.flakeRatePct}%`);
  lines.push('');

  lines.push('## Top Unstable Tests');
  lines.push('');
  if (!report.topUnstable.length) {
    lines.push('No unstable tests detected in this run.');
    lines.push('');
  } else {
    lines.push('| Test | Outcome | Failed Runs | Passed Runs | Total Runs | Duration (ms) |');
    lines.push('| --- | --- | ---: | ---: | ---: | ---: |');
    for (const test of report.topUnstable) {
      lines.push(`| ${test.title.replace(/\|/g, '\\|')} | ${test.outcome} | ${test.failedRuns} | ${test.passedRuns} | ${test.runs} | ${test.durationMs} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function appendGitHubSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  try {
    fs.appendFileSync(summaryPath, `${markdown}\n`, 'utf8');
  } catch (_) {
    // Non-fatal in local runs.
  }
}

function main() {
  if (!fs.existsSync(inputPath)) {
    const noDataReport = {
      generatedAt: new Date().toISOString(),
      sourceFile: inputPath,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        passRatePct: 0,
        flakeRatePct: 0,
      },
      topUnstable: [],
      note: 'No Playwright JSON report was found; flaky trend report is empty for this run.',
    };

    ensureDirFor(outputJsonPath);
    ensureDirFor(outputMdPath);
    fs.writeFileSync(outputJsonPath, JSON.stringify(noDataReport, null, 2));

    const markdown = [
      '# Playwright Flaky Trend Report',
      '',
      `- Generated: ${noDataReport.generatedAt}`,
      `- Source: ${noDataReport.sourceFile}`,
      '',
      noDataReport.note,
      '',
    ].join('\n');
    fs.writeFileSync(outputMdPath, markdown);
    appendGitHubSummary(markdown);
    console.log(noDataReport.note);
    return;
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const payload = JSON.parse(raw);
  const tests = [];

  for (const suite of payload.suites || []) {
    collectTestsFromSuite(suite, [], tests);
  }

  const totalTests = tests.length;
  const passed = tests.filter((t) => t.outcome === 'expected' && t.expectedStatus === 'passed').length;
  const failed = tests.filter((t) => t.outcome === 'unexpected').length;
  const flaky = tests.filter((t) => t.outcome === 'flaky' || t.isFlaky).length;
  const skipped = tests.filter((t) => t.outcome === 'skipped').length;
  const passRatePct = totalTests ? Number(((passed / totalTests) * 100).toFixed(2)) : 0;
  const flakeRatePct = totalTests ? Number(((flaky / totalTests) * 100).toFixed(2)) : 0;

  const topUnstable = [...tests]
    .filter((t) => t.failedRuns > 0 || t.isFlaky || t.outcome === 'flaky' || t.outcome === 'unexpected')
    .sort((a, b) => {
      if (b.failedRuns !== a.failedRuns) return b.failedRuns - a.failedRuns;
      if (b.runs !== a.runs) return b.runs - a.runs;
      return b.durationMs - a.durationMs;
    })
    .slice(0, 10);

  const report = {
    generatedAt: new Date().toISOString(),
    sourceFile: inputPath,
    summary: {
      totalTests,
      passed,
      failed,
      flaky,
      skipped,
      passRatePct,
      flakeRatePct,
    },
    topUnstable,
  };

  ensureDirFor(outputJsonPath);
  ensureDirFor(outputMdPath);
  fs.writeFileSync(outputJsonPath, JSON.stringify(report, null, 2));

  const markdown = renderMarkdown(report);
  fs.writeFileSync(outputMdPath, markdown);
  appendGitHubSummary(markdown);

  console.log(`Flaky trend report written: ${outputJsonPath}`);
  console.log(`Markdown summary written: ${outputMdPath}`);
}

main();
