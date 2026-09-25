# Consistency Leaderboard

This repository automatically updates a leaderboard showing flower collection statistics from Focumon trainers.

The leaderboard is updated every 6 hours and published to GitHub Pages.

[View Live Leaderboard](https://shreyaschavhan.github.io/woh-leaderboard/)

## Your training

The personal training panel uses the trainer selected here or through **This is me** in the standings. It shows that trainer's original artwork, current focus/break state, and publicly reported focus minutes. Start, resume, and finish open the appropriate Focumon page in a new tab; the signed-in user confirms changes there.

GitHub Pages continues to serve the static site. A separate Cloudflare Worker reads public Focumon status without account cookies or credentials. The panel checks every 30 seconds while visible, with a 25-second backend cache and slower retries after failures. It preserves the last known time when retrieval fails. After an observed session ends, the panel links to Focumon's summary for the final total.

The Worker is deployed at `https://woh-focus-api.h1-3989880-research.workers.dev`, and [focus-config.js](focus-config.js) points to its `/api/focus/` endpoint. Publishing this frontend through the existing GitHub Pages workflow enables live tracking. See [Worker setup](services/focus-api/README.md) for local development, tests, and future deployments.

`focus-panel.html` is the shared markup source inserted by `generate_leaderboard.py`, so scheduled leaderboard updates retain the panel. `focus.js`, `focus-state.mjs`, and `focus.css` provide its behavior and presentation. The approved interactive mockup remains available at `design/focus-study/`.

## Focusing now

The community section shows the configured guild roster's public focus sessions, original trainer/Focumon artwork, and observed focus minutes. It updates about once a minute while the page is visible. Filters separate focusing trainers and breaks; selecting a trainer opens details and a public Focumon link. Minutes are never advanced by a local timer. Breaks retain their publicly reported focus total.

The same Worker provides `/api/community/{page}` in cached batches of eight, with bounded concurrency. This keeps each batch within Cloudflare's free-plan request limits. No browser login, account cookies, or credentials are sent to the Worker. The section tracks the guild roster, independently of the personal panel's selected trainer.

Only confirmed states contribute to live counts. Unknown, expired, or failed observations are marked unconfirmed, and last-known sessions are retained until a successful check replaces them. Some public focus links lead to a training center without an identifiable trainer session; these remain unconfirmed instead of being guessed idle. Coverage is displayed below the scene.

`community-panel.html` is inserted by the generator, with behavior in `community.js` and `community-state.mjs`, styling in `community.css`, and scenery in `assets/guild-ground.svg`. The approved sample-data comparison remains in `design/live-focus-study/`. Deploy the updated Worker before publishing these frontend files.
