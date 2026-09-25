# Consistency Leaderboard

This repository automatically updates a leaderboard showing flower collection statistics from Focumon trainers.

The leaderboard is updated every 6 hours and published to GitHub Pages.

[View Live Leaderboard](https://shreyaschavhan.github.io/woh-leaderboard/)

## Your training

The personal training panel uses the trainer selected here or through **This is me** in the standings. It shows that trainer's original artwork, current focus/break state, and publicly reported focus minutes. Start, resume, and finish open the appropriate Focumon page in a new tab; the signed-in user confirms changes there.

GitHub Pages continues to serve the static site. A separate Cloudflare Worker reads public Focumon status without account cookies or credentials. The panel checks every 30 seconds while visible, with a 25-second backend cache and slower retries after failures. It preserves the last known time when retrieval fails. After an observed session ends, the panel links to Focumon's summary for the final total.

The Worker is deployed at `https://woh-focus-api.h1-3989880-research.workers.dev`, and [focus-config.js](focus-config.js) points to its `/api/focus/` endpoint. Publishing this frontend through the existing GitHub Pages workflow enables live tracking. See [Worker setup](services/focus-api/README.md) for local development, tests, and future deployments.

`focus-panel.html` is the shared markup source inserted by `generate_leaderboard.py`, so scheduled leaderboard updates retain the panel. `focus.js`, `focus-state.mjs`, and `focus.css` provide its behavior and presentation. The approved interactive mockup remains available at `design/focus-study/`.
