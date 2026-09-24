Release ← approved design → shared production files → local verification → user-managed push.

Commit `0e3efa2b` is on local `main`, one commit ahead of `origin/main`, ready for the user's manual push. Production changes are confined to `style.css` and `script.js`, based on remote main `9ef4a754`. The generated homepage, templates, and Focumon importer retain their pre-change hashes. `[Observed; High]`

[Computed comparisons](production-comparison.json) found matching styles and geometry at 390, 760, 761, 1100, 1101, 1440, and 1920px, without overflow or title/flower overlap. Mobile at 390px and desktop captures at 761, 1101, and 1920px matched pixel-for-pixel. At 1440px, 342 pixels within two flower-head images differed despite matching measured geometry; the rendering cause was not established. `[Observed; High]`

[Light desktop](release-light-desktop.png), [light mobile](release-light-mobile.png), [animation](release-animated.png), and [trainer history](release-history.png) were visually checked. Theme/sky controls, details, history charts, search, sorting, and flower keyboard activation passed; no page JavaScript errors were reported. `[Observed; High]`

Publishing is reserved for the user. The workflow and live deployment have not been exercised for this commit. `[Observed; High]`

Publish with `git push origin main`, then check the Pages workflow and reload the live page. Rollback should revert `0e3efa2b`, retaining later data updates.
