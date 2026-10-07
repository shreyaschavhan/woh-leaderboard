# Podium and focus polish

[OBSERVED] Open [the full-page Before / After preview](index.html) directly in a browser. The familiar floating toolbar switches the same page in place. **View podium** and **View cards** jump to the two refinements; on small screens, scroll to the podium or use **Cards**.

[OBSERVED] The old [comparison URL](comparison.html) now opens this full-page study. The original site content, artwork files, sample sessions, and light/dark controls remain shared between Before and After.

The proposal combines three visual changes:

- [OBSERVED] Podium artwork uses smooth rendering of the importer's already-smoothed sprites, fixed square dimensions, less overlap, and a softer shadow. Companions remain visible on mobile. The podium blocks retain their original positions and dimensions.
- [OBSERVED] Focus cards gain 16px desktop and 8px mobile side padding, more space above the artwork, and a larger gap before the timer. At 320px, side padding is 6px. Break rows also have more inset.
- [OBSERVED] The stepped-card outline from the first proposal is retained.

[OBSERVED] Before is frozen from `871d48b7`. All 11 recorded production-source hashes remain unchanged. Production implementation waits for approval.

| View | Before | After |
| --- | --- | --- |
| Podium, desktop light | [Current](podium-desktop-light-before.png) | [Proposed](podium-desktop-light-after.png) |
| Podium, desktop dark | [Current](podium-desktop-dark-before.png) | [Proposed](podium-desktop-dark-after.png) |
| Podium, mobile light | [Current](podium-mobile-light-before.png) | [Proposed](podium-mobile-light-after.png) |
| Podium, mobile dark | [Current](podium-mobile-dark-before.png) | [Proposed](podium-mobile-dark-after.png) |
| Focus, desktop light | [Current](desktop-light-before.png) | [Proposed](desktop-light-after.png) |
| Focus, desktop dark | [Current](desktop-dark-before.png) | [Proposed](desktop-dark-after.png) |
| Focus, mobile light | [Current](mobile-light-before.png) | [Proposed](mobile-light-after.png) |
| Focus, mobile dark | [Current](mobile-dark-before.png) | [Proposed](mobile-dark-after.png) |

[OBSERVED] Twelve width/theme/state checks passed across 320, 390, 760, 1024, and 1440px, both themes, and all six sample scenarios. Text and image references match Before; podium block geometry is unchanged. No page or toolbar overflow, broken podium images, or recorded script errors occurred. Before/After and theme controls, keyboard member details, Escape focus restoration, and the old URL redirect passed. Toggling at the spotlights preserved the section's viewport position.

[Verification](review-results.json) · [Source hashes](source-hashes.json) · [Full-page preview](comparison.png)

Root dependency: `review-ready design = faithful artwork AND balanced focus padding AND familiar full-page comparison`.
