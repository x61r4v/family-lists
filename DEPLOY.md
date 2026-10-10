# Deploying family-lists to Cloudflare (x61r4v account)

This fork adds Cloudflare deployment support to upstream ajrcre/family-lists.

## What changed vs upstream
- `lib/db.ts` - uses `@neondatabase/serverless` when running on Workers
  (detected via `navigator.userAgent === "Cloudflare-Workers"`); keeps
  postgres.js / PGlite for local dev.
- `wrangler.jsonc` - Workers config (`nodejs_compat`, ASSETS binding,
  WORKER_SELF_REFERENCE service, `APP_URL` var pointing at the Pages proxy).
- `open-next.config.ts` - OpenNext Cloudflare adapter config.
- `public/_headers` - immutable caching for `/_next/static/*`.
- `pages-proxy/` - Cloudflare Pages catch-all Function that proxies every
  request edge-to-edge to the worker, so networks that cannot reach
  `*.workers.dev` can use the app via `*.pages.dev`. It rewrites
  Origin/Referer to the worker origin so Next.js server-action origin
  checks pass.

## Build & deploy the worker
1. `npm install`
2. **Patch OpenNext (required):** in
   `node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.js` (or
   `load-manifest.js` in 1.20.x), the manifest glob must include
   `preview-props` alongside the other `.next/server/*.json` entries.
   Without this the worker crashes with
   `Unexpected loadManifest(/.next/server/preview-props.json) call!`
   on the first request. Re-apply after every reinstall/upgrade; verify
   whether newer @opennextjs/cloudflare versions still need it.
3. `npx opennextjs-cloudflare build`
4. `npx wrangler deploy` (needs a Cloudflare API token with Workers edit)

## Worker secrets (set once, never commit)
`wrangler secret put DATABASE_URL API_TOKEN PIN_HASH SESSION_SECRET ACCESS_LINK_SECRET`
DATABASE_URL is a Neon pooled connection string (Neon free-tier project
`family-lists`).

## Pages proxy
Deploy `pages-proxy/public` with `wrangler pages deploy public
--project-name family-lists --branch main` from the `pages-proxy`
directory (wrangler picks up the sibling `functions/` directory).
The generated URL is https://family-lists-3q4.pages.dev
(family-lists.pages.dev was taken).

After redeploying either side, smoke-test: GET /login is 200, PIN login
redirects to the list, add item, mark bought, reload - state persists.
