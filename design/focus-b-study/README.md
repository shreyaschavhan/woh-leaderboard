# Focus B — Current / Concept

[OBSERVED] This study follows the repository's [desktop](../desktop-study/README.md) and [live focus](../live-focus-study/README.md) presentation: the complete native homepage with a small floating comparison toolbar. The preview uses the repository's original artwork, typography, theme controls, garden, spotlights, chart, and standings.

Open [the interactive preview](index.html) in Chrome. It uses classic scripts and local sample data, so it can be opened directly from the checkout.

- **Current / Concept B** switches the two focus sections in place. The toolbar does not reserve page space. Switching retains the current scroll coordinates within the available page height.
- **View change** moves to the focus sections. Loading the page does not jump past the hero.
- **Sample data** selects Focusing, Break, Ready, No trainer, Finished, Busy, Quiet, or Offline.
- **Theme** uses the page's existing appearance control. Member details, filters, and session handoffs use local sample interactions.

## Direction B

Use one compact training card beside three small illustrated community cards on desktop. Stack the two sections below 1000px. The personal timer shares its row with the original trainer and companion; actions sit in one integrated footer. Break sessions occupy quieter rows below the active trainers.

The small plum scene and warm primary action carry the selected B direction. Surrounding community cards inherit the page's existing cream or dark surfaces. Preserve the original hero and sprites.

Root design = native page context AND selected B treatment AND interactive comparison AND production isolation.

Methods Now: precedent comparison, visual hierarchy — match earlier repo studies and reduce the focus sections' visual weight; reconsider after browser review.

## Scope and verification

[OBSERVED] Changes are confined to this design directory. `concept.css` contains the proposal. `current-focus.css`, `current-community.css`, `page.css`, and `page.js` freeze the current page. `source-hashes.json` records the original production sources. `build-preview.py` recreates the snapshot from the checkout; sample interaction code is reused from the earlier balance study.

[OBSERVED] JavaScript syntax, local asset references, unique element IDs, sample-data references, and unchanged production hashes passed static checks. These checks do not establish rendered layout or interaction behavior.

[OBSERVED] Browser Use rejected opening this local preview because its URL policy blocks the address. Browser visual and interaction review remains pending. No browser screenshot or pixel-fidelity claim is made for this revision.

The earlier generated images in `../focus-b-refinement/` are not the review artifact for this study. Review this native page comparison instead.
