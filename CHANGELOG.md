# Changelog

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
