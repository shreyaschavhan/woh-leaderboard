# Focus status Worker

The leaderboard remains on GitHub Pages. This read-only Worker serves `GET /api/focus/{trainer}` for the configured roster. It follows Focumon's public focus link and reads that trainer's own session card and public duration. No account credentials, cookies, or session mutations pass through the Worker.

Production endpoint: `https://woh-focus-api.h1-3989880-research.workers.dev/api/focus/`. The initial deployment was made through the signed-in Cloudflare dashboard on 2026-09-25; no CLI credentials were created. The root frontend configuration contains this URL. Future deployments can use the dashboard's **Edit code** or the CLI flow below after authentication.

The public page format is an integration dependency, not a versioned Focumon API. Unknown markup, redirects, or unavailable duration return `503`; the UI displays an unavailable state instead of assuming the session has ended. Public minutes can be rounded. Session completion keeps the last tracked time and links to the native summary.

## Run locally

From this directory, using Node.js 22 or newer:

```powershell
npm ci
npm test
npm run dev
```

In a second terminal, from the repository root:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/#focus-session`. On loopback hosts, the client uses `http://127.0.0.1:8787/api/focus/`; elsewhere it uses the production `apiBase`. The local Worker environment allows only the two documented localhost origins on port 8765.

Tests run the Worker in Miniflare with fixture responses, and cover trainer matching, focus/break/idle parsing, duplicate responsive headings, durations, failures, caching, CORS, allowed trainers, and UI state transitions. They do not create real Focumon sessions.

## Deploy alongside GitHub Pages

1. Review `wrangler.jsonc`. Production `ALLOWED_ORIGINS` is `https://shreyaschavhan.github.io` (an origin has no repository path). Add a new origin if you use a custom domain. Both production and local `ALLOWED_TRAINERS` must reflect roster changes.
2. Authenticate and deploy from this directory:

   ```powershell
   npx wrangler login
   npm run deploy
   ```

3. Copy the emitted Worker URL into the root `focus-config.js`, including the endpoint prefix:

   ```js
   apiBase: 'https://woh-focus-api.YOUR-SUBDOMAIN.workers.dev/api/focus/',
   ```

4. Commit and publish the frontend through the existing GitHub Pages workflow. No frontend build service or migration is needed. Deploy changes to `worker.js` or `wrangler.jsonc` separately with `npm run deploy`.
5. Select your trainer on the published page and confirm it reports the current Focumon state. Start/finish still require native confirmation on Focumon, using the same signed-in trainer.

The checked-in configuration contains the public Worker URL and no credentials. Clearing the URL makes production show **Live tracking unavailable** and link to Focumon.

## Request behavior

- Only configured trainer IDs and `GET`/`OPTIONS` are accepted; arbitrary upstream URLs and query parameters are rejected.
- Successful observations are cached for 25 seconds per edge. Concurrent requests for the same trainer are coalesced within an isolate; failures are briefly cached there to reduce repeated upstream work.
- The browser polls every 30 seconds while visible, slows after failures, and refreshes on return to the tab. Status changes can take roughly a polling interval plus cache age to appear.
- CORS grants only configured origins and never enables credentials. CORS is a browser integration rule, not API authentication; the returned information is public.
- Upstream requests have time and response-size limits. Responses contain only the selected trainer's normalized session fields.

References: [Focumon's public focus links](https://www.focumon.com/for_streamers), [Cloudflare HTMLRewriter](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/), [Worker configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).
