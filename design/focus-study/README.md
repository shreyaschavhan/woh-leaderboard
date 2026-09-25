# Your training — interactive design

Root design → existing leaderboard context + session states + responsive visual review.

Serve the repository root and open `design/focus-study/index.html`. The prototype inserts a personal training panel between the podium and the existing spotlights. It loads the current leaderboard, shared styles, interactions, and original trainer/Boarbox artwork. The approved design has now been implemented in the main page; this separate prototype retains simulated states for visual review. `[Observed; High]`

The visual direction is a mountain lookout: warm gold controls, a large focused-minute count, layered scenery, subtle fireflies, and an asymmetric desktop composition. Characters keep their original artwork without added outlines. Mobile stacks the scene above the controls. `[Observed; High]`

The bottom review toolbar switches Ready, Focusing, Break, Finished, and Offline. Start/finish/manage buttons open an explicitly simulated Focumon handoff. Confirming or dismissing the handoff demonstrates state transitions without contacting Focumon. Theme switching is local to the preview. `[Observed; High]`

Integration constraints represented here:

- Start and finish require native Focumon confirmation; opening the handoff alone never changes session state.
- Focus duration is displayed in minutes, not invented authoritative seconds.
- A break preserves focused time; no unsupported break-duration counter is shown.
- Failed retrieval displays the last known time and unknown status, never an assumed end.
- Live retrieval and a backend are intentionally outside this design prototype.

The dependency for eventual implementation is `our UI → public-state backend → Focumon state`, with `our controls → Focumon → user confirmation` for session changes. `[Inferred; High]`

## Review completed

Chrome review covered the normal desktop viewport and requested 390px/320px mobile sizes, both themes, original sprite loading, and horizontal overflow. All five sample states were exercised. Starting begins at zero; taking/resuming a break preserves focused minutes; canceling finish keeps the session active; confirming finish restores keyboard focus to the next primary action. Offline recovery and Escape dismissal also passed. No browser console errors were reported. `[Observed; High]`

Run locally from the repository root:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/design/focus-study/ . The `?state=idle`, `?state=break`, `?state=complete`, and `?state=stale` query parameters select the initial preview state. `[Observed; High]`
