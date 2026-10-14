# Tesla Model 3 Card

![Tesla Model 3 Card](https://raw.githubusercontent.com/BarBaar44/tesla-model3-card/main/shot.png)

A compact Lovelace card for a Tesla: the car as the picture, its status, battery and range, the charge limit, the lock state and one attention badge. Made for half a sections column (6 columns by 2 rows, about 120px high), next to Mushroom cards: the same card background and rounding, and the same type sizes. One JavaScript file, no build step, no dependencies, no card_mod, no Jinja.

* **The car** fills the top of the card, as large as the space above the text allows. While someone is in the car its wheels spin and the body bobs a little on its suspension.
* **Name line:** "Tesla" with the lock (grey when locked, red when unlocked) and the badge right after it, and the battery % on the right.
* **Status line:** the status text, trimmed and cut off with an ellipsis when it is too long, with the range on the right.
* **Battery bar:** green, amber below 50%, red below 20%, pulsing yellow while charging, with a tick at the charge limit.
* **Badge:** icon and colour from two sensors; when both are empty there is no badge.
* All animations stop when the system asks for reduced motion. Re-renders only when one of its own entities changes.

![Driving: wheels spin, the body bobs](https://raw.githubusercontent.com/BarBaar44/tesla-model3-card/main/animation.gif)

## Install

HACS > three dots > Custom repositories > add `https://github.com/BarBaar44/tesla-model3-card`, type **Dashboard**. Install, then reload the browser.

Put your car picture in `/config/www` (it is served as `/local/...`). The default is `/local/teslam3.png?v=2`: a side view on a transparent background, about 2.5 : 1, facing left. Needs HA 2024.11 or newer.

## Use

```yaml
type: custom:tesla-model3-card
grid_options:
  columns: 6
  rows: 2
```

`grid_options` are the card's own default, so they may be left out. Everything else is optional too; a full example is in [tesla.yaml](tesla.yaml).

Or use the card editor: it shows every entity in use, your defaults included, under **Entities**, plus the name, picture, tap and hold actions and colours. Clearing an entity there switches that part off. Options the editor does not show, such as `wheels`, are kept.

### Options

| Option        | Default                                |
| ------------- | -------------------------------------- |
| `name`        | `Tesla`                                |
| `image`       | `/local/teslam3.png?v=2`               |
| `wheels`      | the two wheels of the default picture; none for another picture. See below |
| `entities`    | see below                              |
| `tap_action`  | `more-info` on the `more_info` entity  |
| `hold_action` | `more-info` on the `more_info` entity  |
| `colors`      | see below                              |

A misspelled option or entity role shows an error card instead of being ignored. Set an entity to `null` to switch that part off.

### Entities

| Role           | Default                                | Used for |
| -------------- | -------------------------------------- | -------- |
| `status`       | `sensor.tesla_status`                  | status line, trimmed |
| `badge_icon`   | `sensor.tesla_badge_icon`              | badge icon, e.g. `mdi:power-plug`; empty: no badge |
| `badge_color`  | `sensor.tesla_badge_color`             | `red`, `yellow`, `green`, `amber`, `orange`, `blue`, `grey` or any CSS colour |
| `battery`      | `sensor.calimero_battery_level`        | battery % and bar |
| `range`        | `sensor.calimero_battery_range`        | range, rounded, in the sensor's unit (km by default) |
| `charge_limit` | `number.calimero_charge_limit`         | tick on the bar |
| `charging`     | `sensor.calimero_charging`             | `charging` makes the bar pulse yellow |
| `driving`      | `binary_sensor.calimero_user_present`  | `on`: the car drives |
| `lock`         | `lock.calimero_lock`                   | `locked` grey, `unlocked` red, other states hidden |
| `more_info`    | `binary_sensor.calimero_status`        | target of tap and hold |

### Colors

Each key takes any CSS color (`"#ff9800"`, `orange`, `var(--orange-color)`).

| Key              | Used for                      | Default                      |
| ---------------- | ----------------------------- | ---------------------------- |
| `battery`        | bar at 50% and above          | `var(--green-color)`         |
| `battery_medium` | bar below 50%                 | `var(--amber-color)`         |
| `battery_low`    | bar below 20%                 | `var(--red-color)`           |
| `charging`       | bar while charging            | `var(--yellow-color)`        |
| `limit`          | charge limit tick             | `var(--primary-text-color)`  |
| `locked`         | lock icon when locked         | `var(--secondary-text-color)`|
| `unlocked`       | lock icon when unlocked       | `var(--red-color)`           |

### Wheels

The wheels are part of the picture. While driving, the card lays a round crop of each wheel over the picture and turns it. Because the picture is drawn in perspective the wheels are ovals, so each crop is squashed back into its oval, and at rest it matches the picture exactly.

The default positions fit `teslam3.png`. For another picture give your own, in % of the picture's width (`x`, `rx`) and height (`y`, `ry`): the centre of the wheel, and its horizontal and vertical radius up to just inside the tyre. `wheels: []` switches the spinning off; the bob stays.

```yaml
image: /local/my-car.png
wheels:
  - { x: 35.4, y: 71.3, rx: 8.3, ry: 22.4 }   # front
  - { x: 91.1, y: 64.9, rx: 5.6, ry: 19.0 }   # rear
```

## Layout

At 6 by 2 the card is about 176px wide on a phone and 256px on a desktop, and 120px high. The car sits on top because its 2.5 : 1 shape needs the width: there it is about 132 by 53px, while next to the text it would shrink to about 75 by 30px on a phone. The lock and badge sit beside the name rather than in the corners, so the car never overlaps them. The height is what limits the car, so on a desktop it stays the same size with more room around it.

## Development

The card needs nothing to run. Tests use jsdom:

```sh
npm install
npm test
```

A release is made by bumping `VERSION` in `tesla-model3-card.js`, adding a `## vX.Y.Z` section to [CHANGELOG.md](CHANGELOG.md), committing, and pushing a matching tag. The Release workflow checks the tag against `VERSION`, runs the tests and publishes the GitHub release with that changelog section as its notes.

## Licence

MIT
