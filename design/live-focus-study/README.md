# Focusing now — Before / After

Open `/design/live-focus-study/` through a server at the repository root:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

The preview follows the earlier desktop and avatar studies: a native full page with a small floating comparison toolbar. There is no iframe or reserved toolbar space.

**Before / After** toggles only the community section in place. The viewport dimensions stay unchanged, and switching modes preserves the current scroll position within the page's available scroll range. **View change** is an explicit shortcut to the insertion point. Loading or toggling the design does not automatically jump there.

The HTML contains a snapshot of the current homepage, with its original styles and scripts. Theme, garden layout, leaderboard interactions, and personal training behavior remain intact. Update this snapshot if the source homepage changes. Production files are untouched.

The proposed section places larger original trainer/Focumon pairs on illustrated mossy ledges inside one continuous mountain landscape. There are no sprite outlines. The scene extends the personal training panel's forest, plum, and gold palette, while the outer heading, 1180px content width, typography, and stepped corners follow the homepage. Equal-size party positions avoid implying a second ranking. Gold numbers emphasize focused minutes; a quieter lavender row separates breaks.

Community sessions are samples; the selector covers Live, Busy, Empty, Partial, and Offline. Refresh advances sample focus minutes while break totals stay fixed. The existing personal panel is never rewritten by the demo controls.

Links:
- `?view=before` — current homepage.
- `?view=after` — added section.
- `?view=after&state=offline` — unavailable example.

Verified in Chrome without resizing the browser: no iframe, fixed floating toolbar, identical viewport dimensions and scroll coordinates through Before/After at both the top and the new section.

Production community integration and deployment are pending.
