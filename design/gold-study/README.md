# Champagne gold study

Gold podium design ← softer color balance + clear first-place emphasis + readable text.

Open the [Current / Concept preview](index.html). The bottom switch compares the original yellow-gold podium with the proposed champagne treatment. `[Observed; High]`

The proposal changes five colors on the first-place podium. Its existing badge, rim, shaded edges, and small history bars inherit the coordinated tones. The original brown text remains. `[Observed; High]`

| Part | Current | Concept |
| --- | --- | --- |
| Face | `#E8BE59` | `#D9BB77` |
| Highlight | `#FFF0B5` | `#F4E6BC` |
| Rim | `#F8D77E` | `#E6CEA0` |
| Side edge | `#C89337` | `#B49658` |
| Lower shadow | `#AD762D` | `#A4814B` |

These values are defined in the frozen baseline and [concept stylesheet](concept.css). `[Observed; High]` The less saturated face and warm shadows should let the character artwork stand out while retaining the gold medal identity. `[Inferred; Medium]`

| View | Desktop, 1440 × 1000 | Mobile, 390 × 844 |
| --- | --- | --- |
| Current, night / dark | [Current](desktop-current.png) | [Current](mobile-current.png) |
| Concept, night / dark | [Concept](desktop-concept.png) | [Concept](mobile-concept.png) |
| Concept, dawn / light | [Dawn](desktop-dawn-light.png) | [Dawn](mobile-dawn-light.png) |
| Concept, day / light | [Day](desktop-day-light.png) | [Day](mobile-day-light.png) |
| Concept, dusk / dark | [Dusk](desktop-dusk-dark.png) | [Dusk](mobile-dusk-dark.png) |

All eight concept views were visually inspected. The preview was also checked at 320 pixels: both comparison buttons worked, the gold face switched to the expected color, and no horizontal page overflow was observed. Screenshots use reduced motion for stable comparison. `[Observed; High]`

The existing `#3D2B22` text has a calculated contrast ratio of **7.23:1** against the champagne face. Labels at 85% opacity have **5.22:1**, and secondary text at 90% opacity has **5.84:1**. `[Observed; High]`

The current rounded landscape, layout, trainer JSON, and all Focumon image references are preserved. Production files match their recorded hashes in `source-hashes.json`; this remains a separate design preview. JavaScript syntax and whitespace checks passed, and the browser reported no page errors. `[Observed; High]`

No issue specific to this color change remained in the reviewed configurations. `[Observed; High]`
