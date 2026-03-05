# Quality Gates

Date: 2026-03-06

## Required Checks Before Merge to Main

1. `backend-api-regression`:
   - Command: `npm run test:api`
   - Scope: backend API contract and lifecycle regressions
   - Required outcome: all tests pass

2. `frontend-e2e`:
   - Command: `npm run test:e2e`
   - Scope: critical and negative-path frontend-integrated workflows
   - Required outcome: all tests pass

3. `frontend-build`:
   - Command: `npm run build --prefix frontend`
   - Scope: production build integrity
   - Required outcome: build succeeds

## CI Workflow

- Workflow file: `.github/workflows/ci-e2e.yml`
- Trigger:
  - push to `main`/`master`
  - pull requests
  - manual dispatch
- Runner: `windows-latest` (aligned with existing npm script environment)
- Concurrency:
  - cancels in-progress runs for same ref
- Artifacts (always uploaded):
  - `playwright-report`
  - `test-results`
  - `flaky-trend-report` (`test-results/flaky-trend.json`, `test-results/flaky-trend.md`)

## Release Gate Policy

1. Do not merge PRs with failed required checks.
2. If E2E fails, inspect Playwright artifacts before rerun.
3. If failures are flaky:
   - reproduce locally with `npm run test:e2e:headed`
   - stabilize selectors/assertions
   - rerun full suite before merge.
4. For known temporary infra incidents, document exception in PR and re-run checks before release tagging.

## Flaky Trend Tracking

1. CI generates a per-run flaky trend summary from Playwright JSON output:
   - Command: `npm run test:e2e:flaky-report`
   - Script: `scripts/ci/flaky-trend-report.js`
2. Outputs:
   - machine-readable: `test-results/flaky-trend.json`
   - human summary: `test-results/flaky-trend.md`
3. `flaky-trend.md` is appended to the GitHub Actions step summary and uploaded as an artifact for run-to-run stability review.
