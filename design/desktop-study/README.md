Desktop design ← shared composition + quieter heading + bounded scenery.

Open the [Current / Concept preview](index.html). The buttons switch between the frozen production layout and this proposal. Use the page's existing theme and sky controls.

The title, navigation, and garden now use the dashboard's 1180px frame. The podium stays centered underneath; the headline caps at 56px and the desktop hero at 650px. At 761–1100px, the title sits above the flowers. `[Observed; High]`

This grouping should make the winners the focal point and reduce the disconnected appearance on large displays. `[Inferred; Medium]`

| Comparison | Current | Concept |
| --- | --- | --- |
| Desktop, dark | [1440px](desktop-current.png) | [1440px](desktop-concept.png) |
| Wide, dark | [1920px](wide-current.png) | [1920px](wide-concept.png) |
| Desktop, light | [1440px](desktop-light-current.png) | [1440px](desktop-light-concept.png) |
| Mobile, dark | [390px](mobile-current.png) | [390px](mobile-concept.png) |
| Mobile, light | [390px](mobile-light-current.png) | [390px](mobile-light-concept.png) |

The [measurements](review-results.json) cover selected widths from 320 to 2560px: no horizontal overflow, broken images, or title/flower overlap. Mobile geometry matches at 320, 390, and 760px; screenshot comparisons match at 320/390px dark and 390px light. Theme/sky controls, comparison switching, and trainer details passed local Chromium checks. The [animated preview](preview.png) was also inspected. `[Observed; High]`

The initial layout received one refinement for scenery coverage and the 75-flower label. Desktop scenery crops to fill the shorter hero; its shapes and colors remain the same. `[Observed; High]`

The proposal lives in [concept.css](concept.css) and the marked garden branch in [study.js](study.js). [Production hashes](source-hashes.json), frozen baselines, trainer JSON, and image tags were verified unchanged. The preview uses the September 23 data snapshot; the live Focumon import was not exercised. `[Observed; High]`

Implementation ← promoted to the shared production CSS/JS. Selected styles and geometry match the approved design with current data at 390, 760, 761, 1100, 1101, 1440, and 1920px. Both themes, animation, trainer details/history, search, sorting, and flower keyboard access were checked. The importer, templates, and generated data were unchanged by the UI work. `[Observed; High]`

See [release notes](RELEASE.md) for verification details and the manual publishing handoff.
