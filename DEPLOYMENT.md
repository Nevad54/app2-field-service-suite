# Deployment Runbook

This project is deployed with:
- Backend: Render (Web Service)
- Frontend: Netlify
- Database: Supabase

## Architecture

- Frontend (Netlify) calls backend API using `REACT_APP_API_BASE_URL`.
- Backend (Render) connects to Supabase using server-side environment variables.

## Required Environment Variables

### Render (backend)

- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<service_role_key>`
- `NODE_ENV=production` (recommended)

### Netlify (frontend)

- `REACT_APP_API_BASE_URL=https://<your-render-service>.onrender.com`

Do not put `SUPABASE_SERVICE_ROLE_KEY` in Netlify.

## One-Time Platform Setup

### Render

1. Create a **Web Service** from repo.
2. Use branch: `master`.
3. Root directory: `backend`.
4. Build command: `npm install`.
5. Start command: `npm start`.
6. Add required env vars and deploy.

Optional: this repo includes [render.yaml](/d:/Web App/app2-field-service-suite/render.yaml) for Blueprint-style setup.

### Netlify

1. Create a site from repo.
2. Branch: `master`.
3. Base directory: `frontend`.
4. Build command: `npm run build`.
5. Publish directory: `build`.
6. Add `REACT_APP_API_BASE_URL` env var and deploy.

Optional: this repo includes [netlify.toml](/d:/Web App/app2-field-service-suite/netlify.toml).

## Pre-Deploy Checklist

Run from repo root:

```bash
npm run ci:check
```

This runs:
- frontend production build
- backend API regression tests

Deploy only if this passes.

## Post-Deploy Smoke Test

Use live Netlify + Render URLs and verify:

1. Staff login (`admin / 1111`)
2. Client login
3. Add task from Projects modal
4. Notifications panel open/create/read
5. Client portal loads jobs/invoices
6. `GET <render-url>/api/status` returns `ok: true`

## Persistence Verification

1. Create/update a record (for example inventory item).
2. Refresh page and confirm data remains.
3. Restart Render service.
4. Refresh and confirm data still remains.

## Rollback

If deployment is broken:

1. In Render and Netlify, redeploy previous successful deployment.
2. In git, identify last stable commit:
   - `git log --oneline`
3. Optionally revert and redeploy:
   - `git revert <bad_commit_hash>`
   - `git push origin master`

## Release Tagging

After a stable deploy:

```bash
git tag -a v1.0.0 -m "Production deploy"
git push origin v1.0.0
```

Use incremental tags for future releases.

## Operational Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` secret and backend-only.
- Treat `master` as deployable only when `npm run ci:check` passes.
- Review Render logs and Netlify deploy logs after each release.
