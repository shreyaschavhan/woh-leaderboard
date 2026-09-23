# Garden and dashboard study

Combined visual design ← separate scene layers + a shared palette + restrained pixel frames.

Open [the interactive comparison](index.html) and switch between **Current** and **Concept**.

## The three changes

1. **Garden composition.** Flowers occupy a rear meadow, with the existing podium characters in the foreground. On phones the meadow sits between the heading and the podiums. All 31 trainer flowers, their values, and their links remain present. `[Observed; High]`
2. **Palette harmony.** Muted foliage, plum ground, warmer whites, and lavender chart accents connect the illustration to the dashboard. Day and night palettes have corresponding landscape colors. The existing podium medal colors are retained. `[Observed; High]`
3. **Card consistency.** Flat surfaces, one-pixel borders, and small stepped corners repeat the podium geometry. Typography stays in the existing typefaces. `[Observed; High]`

These changes should make the page feel like one composed scene while keeping the characters and medals as the strongest color accents. `[Inferred; Medium]`

## Previews

| View | Hero | Dashboard |
| --- | --- | --- |
| Desktop, 1440 × 1000 | [Scene](desktop-hero.png) | [Cards and standings](desktop-dashboard.png) |
| Mobile, 390 × 844 | [Scene](mobile-hero.png) | [Cards and standings](mobile-dashboard.png) |

## Validation and scope

At 320, 390, 760, and 1440 pixels, flower bounds do not intersect the heading, and there is a 21-pixel gap between the planting and the character containers. All three podiums fit within the viewport. The comparison switch and flower-to-trainer drawer interaction were checked. `[Observed; High]`

The approved treatment is implemented in [the main page](../../index.html), through the shared [stylesheet](../../style.css) and [script](../../script.js). Existing generated pages and future template output reference those files. `[Observed; High]`

The comparison remains frozen: `baseline.css` and `../original-script.js` preserve the previous implementation; `concept.css` and `preview.js` show the approved design. `[Observed; High]`

## Implementation verification

Implementation fidelity ← matching appearance, responsive composition, and preserved interactions.

At 1440, 760, 390, and 320 pixels, selected computed styles and element bounds, all 31 flower transforms, the consistency line, and trainer data match the approved preview. No heading overlap or horizontal page overflow was observed; podiums fit within the viewport. `[Observed; High]`

Browser checks passed for pointer and keyboard flower activation, podium drawers, Escape and close controls, trainer search, the empty state, sorting, all four sky states, light/dark switching, mobile drawers, and the frozen Current / Concept comparison. Normal-motion intro, scroll/resize stability, and automatic system themes also passed, with no page errors reported. JavaScript syntax and Git whitespace checks passed. `[Observed; High]`

| Implemented view | Screenshot |
| --- | --- |
| Desktop garden | [1440 × 1000](implemented-desktop.png) |
| Desktop dashboard | [1440 × 1000](implemented-dashboard.png) |
| Mobile garden | [390 × 844](implemented-mobile.png) |
| Mobile dashboard | [390 × 844](implemented-mobile-dashboard.png) |
| Day, light theme | [1440 × 1000](implemented-light.png) |
| Night, dark theme | [1440 × 1000](implemented-night.png) |
