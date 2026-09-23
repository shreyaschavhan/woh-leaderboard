Design ← shared alignment + type hierarchy + trainer-panel consistency.

Open the [Current / Concept preview](index.html). Use **Trainer ↗** to compare the panel; **Dashboard ↗** returns to the page. Scroll upward for the podium, theme, and sky controls.

The proposal is isolated in [concept.css](concept.css). `[Observed; High]`

| Change | Design |
| --- | --- |
| Alignment | Spotlights, community chart, and standings share the existing 1180px maximum width. `[Observed; High]` |
| Typography | Space Grotesk now covers podium and table trainer names; supporting labels increase to 12px. Inter remains the body font. `[Observed; High]` |
| Trainer panel | Stepped card frames, garden sky/ground colors, a quieter chart fill, and a matching history button. `[Observed; High]` |

Two responsive refinement passes kept captions inside their chart card and gave spotlight text more room at intermediate and narrow widths. `[Observed; High]`

Inspected comparisons: desktop **1440 × 1000**, mobile **390 × 844**, dark/night and light/day. `[Observed; High]`

| View | Current | Concept |
| --- | --- | --- |
| Desktop, dark | [Current](desktop-current.png) | [Concept](desktop-concept.png) |
| Desktop panel, dark | [Current](desktop-drawer-current.png) | [Concept](desktop-drawer-concept.png) |
| Mobile, dark | [Current](mobile-current.png) | [Concept](mobile-concept.png) |
| Mobile panel, dark | [Current](mobile-drawer-current.png) | [Concept](mobile-drawer-concept.png) |
| Desktop, light | [Current](desktop-light-current.png) | [Concept](desktop-light-concept.png) |
| Desktop panel, light | [Current](desktop-drawer-light-current.png) | [Concept](desktop-drawer-light-concept.png) |
| Mobile, light | [Current](mobile-light-current.png) | [Concept](mobile-light-concept.png) |
| Mobile panel, light | [Current](mobile-drawer-light-current.png) | [Concept](mobile-drawer-light-concept.png) |

[Measurements](review-results.json) at 320, 600, 760, 761, 960, and 1440px confirmed matching section edges, no horizontal page overflow, and intact spotlight/chart labels. Keyboard comparison, drawer opening/closing, and JavaScript syntax checks passed; no browser page errors were reported. `[Observed; High]`

The six recorded [source hashes](source-hashes.json) describe production before implementation. The frozen baseline, trainer JSON, and image tags match those originals. The vivid gold face remains `#e8be59`; rounded scenery and Focumon source references are preserved. This preview uses frozen data; the production importer is unchanged. `[Observed; High]`

Implementation ← promoted to the shared [production stylesheet](../../style.css). Selected computed styles, including drawer frames and gradients, match this concept at 320, 390, 600, 761, 960, and 1440px. Desktop/mobile screenshots were reviewed in both themes; search, sorting, theme/sky controls, and trainer details passed browser checks. No unresolved difference was found in those checks. `[Observed; High]`
