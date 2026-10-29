# Tesla Model 3 Card

![Tesla Model 3 Card](https://raw.githubusercontent.com/BarBaar44/tesla-model3-card/main/shot.png)

A compact Lovelace card for a Tesla: the car as the picture, its status, battery and range, the charge limit, the lock, and badges for sentry mode, charging and a software update. Made for half a sections column (6 columns by 2 rows, about 120px high), next to Mushroom cards: the same card background and rounding, and the same type sizes. One JavaScript file, no build step, no dependencies, no card_mod, no Jinja.

* **The car** fills the top of the card, as large as the space above the text allows. While someone is in the car its wheels spin and the body bobs a little on its suspension.
* **Name line:** "Tesla" with the lock (grey when locked, red when unlocked) and the badges right after it.
* **Status line:** the status text, trimmed and cut off with an ellipsis when it is too long, with the range on the right.
* **Battery bar:** green, amber below 50%, red below 20%, pulsing yellow while charging, with a tick at the charge limit and the battery % at its end.
* **Badges**, side by side after the lock:
  * **Sentry mode:** camera icon, red when on, grey when off.
  * **Charging:** a yellow pill with a lightning bolt and the time to full ("1:20"), only while charging.
  * **Software update:** blue update icon, only when an update is available.
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
| `battery`      | `sensor.calimero_battery_level`        | battery % and bar |
| `range`        | `sensor.calimero_battery_range`        | range, rounded, in the sensor's unit (km by default) |
| `charge_limit` | `number.calimero_charge_limit`         | tick on the bar |
| `charging`     | `sensor.calimero_charging`             | `charging` makes the bar pulse yellow |
| `driving`      | `binary_sensor.calimero_user_present`  | `on`: the car drives |
| `lock`         | `lock.calimero_lock`                   | `locked` grey, `unlocked` red, other states hidden |
| `sentry`       | `switch.calimero_sentry_mode`          | sentry badge: `on` red, `off` grey, other states hidden |
| `time_to_full` | `sensor.calimero_time_to_full_charge`  | time in the charging badge, as h:mm (hours; the sensor's unit wins) |
| `update`       | `update.calimero_update`               | update badge while `on` |
| `more_info`    | `binary_sensor.calimero_status`        | target of tap and hold |

### Colors

Each key takes any CSS color (`"#ff9800"`, `orange`, `var(--orange-color)`) or `[r, g, b]`. The card editor has a colour picker per key; it writes hex, and leaves a name or `var()` you set in YAML alone until you pick another colour. Picking the default colour removes the key.

`car` takes a Model 3 paint or any colour: `pearl_white`, `quicksilver`, `silver`, `midnight_silver`, `stealth_grey`, `black`, `ultra_red`, `red_multi_coat`, `marine_blue`, `deep_blue`, `frost_blue`. The editor offers them in a list. The paint is multiplied over the picture with a little light from above: white parts take the colour, black lines and windows stay black, the wheels keep their rims. It suits the default line drawing; on a photo it only darkens. `black` is shown as a dark grey, otherwise the lines would disappear.

`rims` darkens the drawn rims the same way: the spokes take the colour, the gaps stay black, and the colour turns with the wheels. It needs `wheels` (the default picture has them).

| Key              | Used for                      | Default                      |
| ---------------- | ----------------------------- | ---------------------------- |
| `car`            | paint of the car (see below)  | none (as drawn)              |
| `rims`           | rims: `black`, `graphite` or any colour | none (as drawn)    |
| `battery`        | bar at 50% and above          | `var(--green-color)`         |
| `battery_medium` | bar below 50%                 | `var(--amber-color)`         |
| `battery_low`    | bar below 20%                 | `var(--red-color)`           |
| `charging`       | bar while charging            | `var(--yellow-color)`        |
| `limit`          | charge limit tick             | `var(--primary-text-color)`  |
| `locked`         | lock icon when locked         | `var(--secondary-text-color)`|
| `unlocked`       | lock icon when unlocked       | `var(--red-color)`           |
| `sentry_on`      | sentry badge when on          | `var(--red-color)`           |
| `sentry_off`     | sentry badge when off         | `var(--secondary-text-color)`|
| `update`         | update badge                  | `var(--blue-color)`          |

The charging badge uses `charging`.

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

At 6 by 2 the card is about 176px wide on a phone and 256px on a desktop, and 120px high. The car sits on top because its 2.5 : 1 shape needs the width: there it is about 122 by 49px, while next to the text it would shrink to about 75 by 30px on a phone. The lock and badges sit beside the name rather than in the corners, so the car never overlaps them. With sentry on, charging and an update all at once they still fit on a phone, with a few pixels to spare; the battery % sits at the end of the bar to make that room. The height is what limits the car, so on a desktop it stays the same size with more room around it.

## Development

The card needs nothing to run. Tests use jsdom:

```sh
npm install
npm test
```

A release is made by bumping `VERSION` in `tesla-model3-card.js`, adding a `## vX.Y.Z` section to [CHANGELOG.md](CHANGELOG.md), committing, and pushing a matching tag. The Release workflow checks the tag against `VERSION`, runs the tests and publishes the GitHub release with that changelog section as its notes.

## Licence

MIT
