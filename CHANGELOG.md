# Changelog

## v0.3.0

### Added
* **Sentry badge:** camera icon after the name, red when sentry mode is on, grey when off (`sentry`, default `switch.calimero_sentry_mode`).
* **Charging badge:** a yellow pill with a lightning bolt and the time to full charge as h:mm, only while charging (`time_to_full`, default `sensor.calimero_time_to_full_charge`).
* **Update badge:** blue update icon while a software update is available (`update`, default `update.calimero_update`).
* Colours `sentry_on`, `sentry_off` and `update`, and the three entities in the visual editor.

### Changed
* The battery % moved from the name line to the end of the battery bar, to make room for the badges.

### Removed
* The template badge (`badge_icon` and `badge_color`, `sensor.tesla_badge_icon` and `sensor.tesla_badge_color`): the three badges replace it. Old configs that still set these roles keep working; the roles are ignored with a warning in the browser console, and the visual editor drops them on the next save.

## v0.2.0

### Changed
* **Driving animation:** while someone is in the car the wheels now spin and the body bobs a little on its suspension, instead of the car driving off and coming back. The car stays in place, so it never leaves the card.

### Added
* **Visual editor:** name, picture, every entity (with the defaults shown), tap and hold actions and colours. Clearing an entity switches that part off; only values that differ from the defaults are written to the YAML, and options the editor does not show are kept.
* `wheels`: the wheel positions in the picture, in % of its width and height. Defaults fit `teslam3.png`; another picture gets no spinning wheels until you set them, and `wheels: []` switches them off.

## v0.1.0

First release. A compact card for a Tesla, made to sit at 6 by 2 in a sections view next to Mushroom cards, in the style of the Appliance, Vacuum, Room and Heating Control cards.

### Added
* **Car picture** on top, as large as the card allows, from `/local/teslam3.png?v=2` by default (`image`). While someone is in the car it drives off nose first and comes back in from the other side.
* **Name line** with the lock (grey locked, red unlocked) and the attention badge, and the battery % on the right.
* **Status line** with the trimmed status text, cut off with an ellipsis when too long, and the rounded range on the right.
* **Battery bar:** green, amber below 50%, red below 20%, pulsing yellow while charging, with a tick at the charge limit.
* **Badge** from an icon sensor and a colour sensor (colour names or any CSS colour); no badge when both are empty.
* **Actions:** tap and hold through Home Assistant's own action handler, more-info on `binary_sensor.calimero_status` by default.
* Every entity overridable or switched off with `null`; every colour configurable with `colors`.
* Mushroom type sizes (14px name, 12px secondary text). Nothing overlaps or runs off the card at phone width. All animations stop under reduced motion.
