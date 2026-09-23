# Pixel podium concept

Open [the interactive mockup](pixel-podium.html) and use **Original / Pixel podium** to compare the two treatments. The preview uses the repository's existing artwork and sample standings. `[Observed; High]`

## Art direction

Treat the podiums as objects in the pixel garden:

- Use a four-pixel construction grid, stepped corners, and a dark outline.
- Replace smooth shading with a flat face, a light top lip, and a hard shaded edge.
- Make rank badges and the subtle face numerals pixel-shaped.
- Keep names and scores in the existing readable typefaces.
- Preserve the gold / silver / bronze palette and the 2–1–3 arrangement.

| Platform | Face | Top highlight | Base shade |
| --- | --- | --- | --- |
| Gold | `#E8BE59` | `#FFF0B5` | `#AD762D` |
| Silver | `#BDC5DB` | `#EDF0FB` | `#7C88AB` |
| Bronze | `#CD9978` | `#F5D4B1` | `#915B49` |

The restrained palette and repeated edge treatment should make the podiums feel like part of the same illustration as the characters. `[Inferred; Medium]`

## Review images

| View | Original | Concept |
| --- | --- | --- |
| Desktop, 1440 × 900 | [Original](podium-original-desktop.png) | [Concept](podium-desktop.png) |
| Mobile, 390 × 844 | [Original](podium-original-mobile.png) | [Concept](podium-mobile.png) |

The podiums were also inspected at 320 pixels wide. The narrow layout wraps longer names and keeps all three blocks within the viewport. `[Observed; High]`

The approved treatment is implemented in the main [style.css](../style.css). This mockup keeps a frozen [original stylesheet](original-style.css) so its before/after switch remains useful. `[Observed; High]`

The implemented podium geometry and visual styles match the concept at 320, 390, 760, and 1440 pixels. Pointer and keyboard opening, Escape closing, and light/dark theme switching were checked in the browser. `[Observed; High]`

Implementation screenshots: [desktop](implemented-desktop.png) and [mobile](implemented-mobile.png).
