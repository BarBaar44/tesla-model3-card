# Tesla Model 3 Card: notes for working on this repo

HACS dashboard card (Lovelace) for the owner's Tesla Model 3 ("Calimero"). Owner: BarBaar44 (Bb). Sister repos with the same conventions: [appliance-card](https://github.com/BarBaar44/appliance-card) (the reference), [vacuum-card](https://github.com/BarBaar44/vacuum-card), [room-card](https://github.com/BarBaar44/room-card) and [Heating-Control-Card](https://github.com/BarBaar44/Heating-Control-Card).

## Files

| File | Purpose |
|---|---|
| `tesla-model3-card.js` | The whole card: plain custom element, no build step, no dependencies. `TESLA_DEFAULTS` holds the owner's entities and picture, `TESLA_COLORS` the colours. |
| `tests/tesla-model3-card.test.js` | jsdom tests: text, battery colours and tick, lock, badge, driving, config errors, re-render, actions. `npm test`. |
| `hacs.json` | HACS manifest (HA 2024.11+). |
| `README.md` | User docs, also the HACS info page. Keep the entity and colour tables in sync with the code. |
| `CHANGELOG.md` | One `## vX.Y.Z` section per release; the Release workflow uses it as the release notes. |
| `shot.png`, `animation.gif` | README images, linked by absolute raw URL so they render in HACS. |
| `tesla.yaml` | Minimal and full example configs. |

## Rules to keep

* Size: 6 columns by 2 rows (about 120px high, 176px wide on a phone, 256px on a desktop), next to Mushroom vertical cards. Same background and rounding (plain `ha-card`), Mushroom type: 14px / 500 primary, 12px secondary in `--secondary-text-color`.
* Nothing may overlap or run off the card at phone width. After any layout change, render it in a real browser (Playwright) in a 12-column, 56px-row grid at 360px and 520px section width, and check every element against the card edge.
* Every `ha-icon` gets an explicit size (the owner's earlier button-card attempt had an `ha-icon` stretch over the whole card).
* The lock and badge sit next to the name, not in the corners: in the corners they overlap the car, especially while it drives.
* The picture faces left, so driving forward moves it left, then back in from the right. Ask before changing the direction.
* The status sensor can carry whitespace: always trim. Badge: no badge when the icon is empty.
* Tap and hold go through `hass-action` (HA's own handler). The card never calls services.
* Re-render only when one of the card's own entities changes; the DOM is built once per config and updated in place. All animations stop under `prefers-reduced-motion`.
* Top-level names are prefixed `TESLA_`/`tesla`: the file may be loaded as a classic script next to the sister cards.

## Releasing

1. Bump `VERSION`, add the CHANGELOG section, commit, push to `main`, check Validate is green.
2. The owner pushes the `vX.Y.Z` tag. **Never tag or release without the owner's explicit go.** Claude sessions here cannot push tags or create releases anyway.
3. Changes marked "no release yet" go to `main` without a version bump.
