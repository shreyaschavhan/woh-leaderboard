# Pixel landscape study

Landscape design ← consistent artwork + restrained detail + responsive composition.

Open the [Current / Concept preview](index.html). Use the bottom switch to compare the scenery and the existing sky button to cycle dawn, day, dusk, and night. `[Observed; High]`

The concept gives the raised meadow and distant hills stepped silhouettes, with a narrow rim, broad shadow shelf, and sparse grass marks. The sun and moon use a sixteen-unit pixel outline with simple shading; the pond uses stepped banks and small water highlights. Landscape colors come from the existing scene palette. `[Observed; High]`

These shapes should connect the scenery more closely to the character sprites and podiums while keeping the trainers dominant. `[Inferred; Medium]`

| Scene | Desktop, 1440 × 1000 | Mobile, 390 × 844 |
| --- | --- | --- |
| Current, night | [Current](desktop-current.png) | [Current](mobile-current.png) |
| Concept, night | [Concept](desktop-concept.png) | [Concept](mobile-concept.png) |
| Concept, dawn | [Dawn](desktop-dawn.png) | [Dawn](mobile-dawn.png) |
| Concept, day | [Day](desktop-day.png) | [Day](mobile-day.png) |
| Concept, dusk | [Dusk](desktop-dusk.png) | [Dusk](mobile-dusk.png) |

The screenshots use reduced motion for a stable comparison. All four sky modes were visually reviewed at desktop and mobile sizes; the 320-pixel layout and 760-pixel light theme were also inspected. `[Observed; High]`

At widths of 1440, 760, 390, and 320 pixels, switching Current / Concept preserved the trainer layout, every flower's position, the threshold line, image sources, and trainer data. No horizontal page overflow was observed. The comparison buttons, sky cycle, theme toggle, flower-to-trainer drawer, and Escape dismissal worked; the browser reported no page errors. JavaScript syntax and whitespace checks passed. `[Observed; High]`

This is an isolated, frozen design preview. `baseline.css` and `baseline.js` match the production sources recorded in `source-hashes.json`; production files remain unchanged. The copied page preserves every image tag and the original trainer JSON, including Focumon-derived avatar references. No replacement character artwork was created. `[Observed; High]`

No unresolved issue was found in the checked configurations. Production integration remains a separate step. `[Observed; High]`
