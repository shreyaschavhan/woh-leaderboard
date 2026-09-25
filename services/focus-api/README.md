# Focus status Worker

The leaderboard remains on GitHub Pages. This read-only Worker serves `GET /api/focus/{trainer}` for the configured roster. It follows Focumon's public focus link and reads that trainer's own session card and public duration. No account credentials, cookies, or session mutations pass through the Worker.

Production endpoint: `https://woh-focus-api.h1-3989880-research.workers.dev/api/focus/`. The initial deployment was made through the signed-in Cloudflare dashboard on 2026-09-25; no CLI credentials were created. The root frontend configuration contains this URL. Future deployments can use the dashboard's **Edit code** or the CLI flow below after authentication.

Community support was deployed through the same dashboard on 2026-09-25, active version `522811d5`. All four production community pages returned HTTP 200 with the GitHub Pages CORS origin; the personal endpoint remained available. The source was compared against the editor before deployment. No account credentials or environment settings were changed.

The public page format is an integration dependency, not a versioned Focumon API. Unknown markup, redirects, or unavailable duration return `503`; the UI displays an unavailable state instead of assuming the session has ended. Public minutes can be rounded. Session completion keeps the last tracked time and links to the native summary.

## Community sessions

`GET /api/community/0` returns the first alphabetically sorted roster batch:

```json
{
  "page": 0, "pageSize": 8, "pages": 4, "total": 31,
  "checkedAt": "2026-09-25T12:00:00.000Z",
  "trainers": [
    {"trainer": "example", "state": "focus", "checkedAt": "2026-09-25T12:00:00.000Z", "session": {"id": "123", "focusMinutes": 24, "approximate": false}}
  ]
}
```

The example is abbreviated; each page contains eight members except the final page. Read subsequent numbered pages up to `pages - 1`. States are `focus`, `break`, `idle`, or `unavailable`. Unavailable entries have a null session and checked time. Community responses omit task names and training-center details. The allowlist is deduplicated, sorted, and capped at 256 trainers.

Batches share the personal endpoint's in-memory observations. They use at most three concurrent upstream connections and eight observations per request. Each observation permits at most five focus-link requests and one stats request: at most 48 upstream fetches plus the batch's two Cache API calls, within the [Workers Free subrequest limit](https://developers.cloudflare.com/workers/platform/limits/). Batches have an 18-second upstream deadline. Successful pages cache for 25 seconds; pages containing unknown states cache for five seconds. A changed roster receives a different cache key.

The client loads the first page, then at most two more pages concurrently, polling once a minute while visible. Missing pages and malformed entries become unconfirmed. It stops polling when hidden, aborts outstanding work, and expires observations after two minutes. Idle observations remove completed community sessions; failures preserve last-known sessions without counting them as live.

Some public focus links redirect to a center with no identifiable own-session card. The API deliberately returns unavailable for those trainers, even when other center activity is visible. Neither another trainer's session nor absence from an ambiguous page proves that trainer's current state.

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

Tests run the Worker in Miniflare with fixture responses, and cover trainer matching, focus/break/idle parsing, duplicate responsive headings, durations, failures, caching, CORS, allowed trainers, community pagination, the cold-batch request budget, and UI state transitions. They do not create real Focumon sessions.

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
