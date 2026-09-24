Deployment ← promote the approved design → verify production → release through GitHub Pages → confirm live behavior.

The [existing workflow](../../.github/workflows/update_leaderboard.yml) is configured for pushes to `main`, every six hours, and manual dispatch. Its steps regenerate the leaderboard, commit data/assets, and deploy the repository to Pages. The [homepage template](../../template.html) loads shared `style.css` and `script.js`. `[Observed; High]`

1. **Prepare the release.** Check remote `main` and recent workflow runs; record the last successful deployment's commit. Start a release branch from the latest `main`, preserving the approved preview as the visual reference.

2. **Promote the design.** Port [concept.css](concept.css) into [style.css](../../style.css), replacing preview selectors with homepage selectors and keeping the desktop media queries. Port the marked garden changes from [study.js](study.js) into [script.js](../../script.js), using the desktop breakpoint to activate them. Include the shared garden bounds, stem sizing, label placement, and scenery cropping. Keep mobile geometry intact. Planned production scope: these two shared files; retain the existing templates, trainer data, and Focumon importer.

3. **Verify production against the approved preview.** Check JavaScript syntax, then compare the actual homepage at 390, 760, 761, 1100, 1101, 1440, and 1920px. Inspect both themes and normal animation. Confirm mobile parity, readable flowers, no overflow, and working theme/sky controls, flowers, and trainer details. Check one trainer history page for stylesheet regressions. Confirm regeneration still references the shared assets and current trainer image paths.

4. **Release.** Commit the production changes as one UI commit. Reconcile any newer automated data commits, then merge and push to `main`. Follow the existing generation and Pages deployment job through completion; use the push-triggered run.

5. **Confirm and retain rollback.** Reload the [live leaderboard](https://shreyaschavhan.github.io/woh-leaderboard/) after deployment; check desktop and mobile, both themes, trainer details, and loaded asset versions. If the release introduces a regression, revert only the UI commit and let the same workflow redeploy, retaining subsequent leaderboard history and avatar updates.

Release acceptance: production matches the approved desktop concept, mobile matches its baseline, the data/image update path remains intact, and the live Pages run succeeds. The design study already passed local visual checks; production and live verification remain release tasks. `[Observed; High]`
