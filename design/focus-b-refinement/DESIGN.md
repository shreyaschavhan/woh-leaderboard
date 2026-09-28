# B: compact illustrated focus

[OBSERVED] The user selected B and asked for design first. This folder contains visual mockups and design decisions. No production implementation is included.

- [Desktop mockup](01-desktop.png)
- [Mobile mockup](02-mobile.png)
- [Final imagegen prompts](final-prompts.md)
- [Initial direction prompt](prompts.md)

## Composition

Keep the existing garden hero and podiums as the dominant artwork. Treat personal training and live community sessions as one supporting area between the podiums and weekly highlights.

On desktop, align the two section headings and use two columns: a compact personal session at the left, three illustrated community cards and one break row at the right. On mobile, stack the sections while keeping the personal artwork beside its timer and task. Do not turn the artwork into a separate banner.

Use the site's existing cream, mauve and plum surfaces. The personal scene uses plum dusk to connect it to the podium ground. Community cards stay cream, with small sprite pairs and a quiet ground shadow.

## Proposed layout specification

[ASSUMED] These are design targets in CSS pixels for later implementation, not measurements of a running UI.

| Element | Desktop target | Mobile target |
| --- | --- | --- |
| Content width | Existing 1180px maximum | 16px side gutters |
| Section layout | 440px personal + 28px gap + 712px community | Stacked below roughly 1024px |
| Focus area height | About 340px with headings and metadata | Content-driven; no fixed section height |
| Personal card | About 240px high, including action strip | About 220px high; information and artwork share a row |
| Personal timer | 48px; tabular digits | 48px; allow long durations to shrink and wrap |
| Scene artwork | Modest pair in the right side of the card | About 106px high; preserve original aspect ratio |
| Community grid | Three columns with 8-12px gaps | Three columns at 390px, about 114px per card |
| Member artwork | About 78px high | About 66px high |
| Name / duration | 14px / 28px | At least 12px / 23px |
| Buttons | At least 40px effective height | At least 44px effective height |
| Card corners | 6px | 6px |

Below 360px, reflow the community cards into compact horizontal rows if names or controls no longer fit. Keep the illustrated pairs; avoid shrinking essential labels. For a busy guild, wrap additional cards naturally rather than stretching the personal scene.

## Personal session hierarchy

1. Section title and trainer selection.
2. Current status, elapsed focused time, and task.
3. Original trainer and companion as supporting artwork.
4. Primary Focumon action and quieter finish/resume action.
5. One short external caption explaining that sessions run on Focumon.

Remove the motivational headline, all-caps eyebrow, location footer, and repeated instructional lines from this proposed presentation. Keep the real session actions and status semantics.

## Community hierarchy

Use the heading and totals to explain live activity. Keep the filters and refresh action in one compact line. Each active card contains one trainer/companion pair, the name, an optional "you" marker, and focused minutes. Leave clear space between sprite feet and the name.

Show breaks in a single quiet row below the active cards: small trainer, name, explicit break status, and focused minutes. Keep one last-updated label for the section. Clicking a member should retain the existing detail behavior in any later implementation.

## State rules for later implementation

| State | Required presentation |
| --- | --- |
| No trainer | Trainer picker and a clear choice prompt; no fabricated elapsed time. |
| Ready | Start-on-Focumon action; no large zero timer. |
| Focusing | Live status, current focused minutes, task, primary action and finish action. |
| On a break | Explicit break label; focused minutes stay frozen and are described as focus time before the break. |
| Complete | Completed-session minutes and start-another action; no active status dot. |
| Unavailable/stale | Last-known time, an unconfirmed status, and retry; never claim live activity. |
| Quiet guild | Short empty-state message and Focumon action within the compact section. |
| Busy guild | Additional cards wrap; all member names and actions remain available. |

Use a semantic button/link for every action, visible keyboard focus, explicit accessible labels, and reduced-motion support. Keep scenery decorative. These are design requirements, not implemented behavior in the PNGs.

## Theme mapping

| Role | Light | Dark |
| --- | --- | --- |
| Page | Existing `--bg` (#eee8e7) | Existing `--bg` (#161421) |
| Member surface | Existing `--surface` (#fbf6ee) | Existing `--surface` (#221e31) |
| Text | Existing `--text` (#302638) | Existing `--text` (#f4eee7) |
| Accent | Existing `--accent` (#80618f) | Existing `--accent` (#b9a0d8) |
| Personal scene | Plum dusk (#342d40) | Same restrained scene, with a visible border |

Keep the original sprite colors in both themes. The supplied mockups show the light theme; the dark mapping above remains a design specification, not a visually validated dark mockup.

## Scope and verification

[OBSERVED] These images were produced with the built-in image_gen tool and inspected visually for layout, names, card separation, and complete desktop podiums. They are generated design references, not browser screenshots. Raster interpretation of the surrounding hero, sprites, and standings is not a request to redraw those parts; retain the original production assets and page content when implementation is separately authorized.

[OBSERVED] No browser behavior, accessibility behavior, session actions, or responsive implementation has been tested for this design. The review artifact is the PNG pair and this specification. No site was deployed.

Root outcome = training panel AND community cards AND page cohesion, subject to preserving production until implementation is authorized.

Methods Now: visual hierarchy, contextual comparison - review B at desktop and mobile sizes; reconsider proportions when user feedback identifies crowding or competing emphasis.
