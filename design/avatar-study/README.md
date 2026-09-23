# Avatar portrait study

Avatar polish ← natural proportions + consistent head placement + crisp rendering at desktop and mobile sizes.

Open [Current / Concept](index.html). The preview opens at the standings, with the proposed treatment selected.

## The design

The same character images become head-and-shoulders portraits inside the existing 46-pixel desktop and 40-pixel mobile frames. The image is rendered proportionately at 112 × 112 pixels, with horizontal clipping instead of the current squeezed shape. Sprite-specific offsets center the head and normalize the space above it. `[Observed; High]`

The artwork, image references, trainer data, frame dimensions, and table layout remain unchanged in the comparison. `[Observed; High]`

## Focumon remains the source

The implementation keeps the existing Focumon import responsible for avatar selection. This treatment styles the current image; it does not create or assign replacement portrait files. Alignment rules match artwork filenames, never trainer names or IDs. Swapping an image source in the browser changed both its artwork and alignment while keeping the same trainer row. `[Observed; High]`

An unfamiliar sprite uses the proportionate, centered default crop. Unseen poses may need an alignment adjustment after visual review. `[Inferred; Medium]`

The existing workflow is scheduled every six hours, and the generator reads each trainer's current avatar URL. `[Observed; High]` A changed avatar selection should therefore appear after the next successful import and publication. `[Inferred; High]`

## Previews

| View | Current | Concept |
| --- | --- | --- |
| Desktop, 1440 × 1000 | [Current](desktop-current.png) | [Portraits](desktop-concept.png) |
| Mobile, 390 × 844 | [Current](mobile-current.png) | [Portraits](mobile-concept.png) |

The same portrait treatment was also visually checked in the [light theme](desktop-light.png). `[Observed; High]`

## Verification

All 17 distinct sprite designs were visually inspected at desktop and mobile portrait sizes. At 1440, 390, and 320 pixels, all 31 avatar images preserve equal width and height; row geometry, frames, trainer data, and image sources match Current. No horizontal page overflow was observed. The Current / Concept switch and swapping the image source were checked. `[Observed; High]`

The approved treatment is now integrated into the shared [production stylesheet](../../style.css), used by both the current page and generated template output. The comparison remains isolated: `baseline.css` and `baseline.js` freeze the presentation before this change; `concept.css` contains the approved treatment. `[Observed; High]`

## Implementation verification

Implemented avatar polish ← matching the approved design + responsive layout + preserving avatar changes from Focumon.

At 1440, 760, 390, and 320 pixels, all 31 portrait styles and bounds, frame dimensions, table rows, and trainer data match the approved preview. No horizontal page overflow was observed. `[Observed; High]`

Changing the same trainer's image among two sprites with individual crop offsets and one with the default crop updated the loaded artwork and alignment correctly, without retaining the previous image's offsets. Portrait links, the trainer drawer, Escape dismissal, search, and the light theme passed browser checks. No page errors were reported. `[Observed; High]`

The importer, template, page data, and JavaScript match their recorded hashes; only the production CSS changed. `git diff --check` passed. `[Observed; High]`

[Implemented desktop](implemented-desktop.png) · [Implemented mobile](implemented-mobile.png) · [Implemented light theme](implemented-light.png)
