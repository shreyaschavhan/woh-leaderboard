# Stepped focus card frames

[OBSERVED] This design study extends the existing spotlight-card frame to **Your training** and **Focusing now**. It uses the same 8px corners, 4px steps, and thin border. Production files remain unchanged.

Open [the side-by-side comparison](comparison.html) directly in a browser. Choose desktop/mobile, light/dark, and a training-card close-up, session-card close-up, or full context.

Open [the interactive full-page preview](index.html) to toggle **Before / After** without moving the page, change theme, and try focusing, no trainer, break, ready, quiet, or offline examples. No local server is required.

Review corner shape, border weight, and how the cards fit beside the existing spotlight frames. Implementation waits for approval.

| View | Before | After |
| --- | --- | --- |
| Desktop light | [Current](desktop-light-before.png) | [Proposed](desktop-light-after.png) |
| Desktop dark | [Current](desktop-dark-before.png) | [Proposed](desktop-dark-after.png) |
| Mobile light | [Current](mobile-light-before.png) | [Proposed](mobile-light-after.png) |
| Mobile dark | [Current](mobile-dark-before.png) | [Proposed](mobile-dark-after.png) |

[OBSERVED] The page is frozen from `871d48b7`, with original artwork and deterministic sample sessions. Both versions use identical content, typography, colors, and layout. The real component rendering and interaction code runs against the samples; no focus API request leaves the preview.

[OBSERVED] Checks covered 16 width/theme/state combinations at 320, 390, 760, and 1440px, plus four final frame-mask checks. All measured content positions and text matched, with no horizontal overflow or recorded script errors. Before/After, theme, sample selection, member details, Escape focus restoration, and preview jumps passed. Keyboard focus retains its visible 2px outline outside the card.

[OBSERVED] All four final screenshot pairs have no changes outside the target cards. Two interior pixels per pair differ by one RGB level; larger differences are confined to card edges. All 11 production-source hashes remain unchanged.

[Verification](review-results.json) · [Capture states](capture-states.json) · [Pixel comparison](pixel-comparison.json) · [Source hashes](source-hashes.json)

Root dependency: `ready for review = frame design AND faithful before/after comparison AND visual verification`.
