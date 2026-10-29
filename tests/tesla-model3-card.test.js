// Tests for tesla-model3-card.js in a simulated browser. Run: npm test
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const dom = new JSDOM("<!doctype html><body></body>", { runScripts: "outside-only", pretendToBeVisual: true });
const w = dom.window;
w.eval(fs.readFileSync(path.join(__dirname, "..", "tesla-model3-card.js"), "utf8"));
const Card = w.customElements.get("tesla-model3-card");
assert(Card, "registered");

const st = (state, attributes = {}) => ({ state: String(state), attributes, last_changed: "x" });
const base = (o = {}) => ({
  "sensor.tesla_status": st(o.status ?? "Charged"),
  "sensor.calimero_battery_level": st(o.pct ?? 80),
  "sensor.calimero_battery_range": st(o.km ?? 390.4, o.unit === null ? {} : { unit_of_measurement: o.unit || "km" }),
  "number.calimero_charge_limit": st(o.limit ?? 80),
  "sensor.calimero_charging": st(o.ch ?? "complete"),
  "binary_sensor.calimero_user_present": st(o.drive ?? "off"),
  "lock.calimero_lock": st(o.lock ?? "locked"),
  "switch.calimero_sentry_mode": st(o.sentry ?? "off"),
  "sensor.calimero_time_to_full_charge": st(o.ttf ?? 0, o.ttfUnit === null ? {} : { unit_of_measurement: o.ttfUnit || "h" }),
  "update.calimero_update": st(o.upd ?? "off"),
  "binary_sensor.calimero_status": st("on"),
});
const hass = (states) => ({ states });

function render(states, config = {}) {
  const c = new Card();
  w.document.body.appendChild(c);
  c.setConfig(config);
  c.hass = hass(states);
  return c;
}
function read(c) {
  const e = c._el;
  return {
    name: e.name.textContent,
    status: e.status.textContent,
    pct: e.pct.textContent,
    range: e.range.textContent,
    fill: e.fill.style.width,
    colour: e.fill.style.getPropertyValue("--bc"),
    barHidden: e.barrow.classList.contains("hide"),
    tick: e.tick.classList.contains("show") ? e.tick.style.left : null,
    charging: e.card.classList.contains("charging"),
    driving: e.card.classList.contains("driving"),
    lock: e.lock.classList.contains("show") ? (e.lock.classList.contains("open") ? "open" : "locked") : null,
    lockIcon: e.lockIcon.getAttribute("icon"),
    sentry: e.sentry.classList.contains("show") ? (e.sentry.classList.contains("on") ? "on" : "off") : null,
    charge: e.charge.classList.contains("show") ? e.chargeLeft.textContent : null,
    update: e.update.classList.contains("show"),
    pctInBar: e.pct.parentElement === e.barrow,
    img: e.img.getAttribute("src"),
  };
}
const v = (states, config) => read(render(states, config));

/* ---- text ------------------------------------------------------------------- */

let r = v(base({ status: "  Ready @ 07:15 \n" }));
assert.equal(r.name, "Tesla");
assert.equal(r.status, "Ready @ 07:15", "status is trimmed");
assert.equal(r.pct, "80%");
assert.equal(r.range, "390 km", "range rounded");
assert.equal(r.img, "/local/teslam3.png?v=2");

r = v(base({ km: 141.6, unit: "mi" }));
assert.equal(r.range, "142 mi", "unit from the sensor");
r = v(base({ status: "unavailable", pct: "unknown", km: "unavailable" }));
assert.equal(r.status, "");
assert.equal(r.pct, "");
assert.equal(r.range, "");
assert(r.barHidden, "no battery: no bar");

/* ---- battery bar --------------------------------------------------------------- */

r = v(base({ pct: 80 }));
assert.equal(r.colour, "var(--tc-battery)");
assert.equal(r.fill, "80%");
assert(!r.charging);
r = v(base({ pct: 49 }));
assert.equal(r.colour, "var(--tc-battery-medium)", "amber below 50");
r = v(base({ pct: 50 }));
assert.equal(r.colour, "var(--tc-battery)", "50 is normal");
r = v(base({ pct: 19 }));
assert.equal(r.colour, "var(--tc-battery-low)", "red below 20");
r = v(base({ pct: 12, ch: "charging" }));
assert.equal(r.colour, "var(--tc-charging)", "charging wins");
assert(r.charging, "pulses while charging");
r = v(base({ ch: "Charging" }));
assert(r.charging, "case does not matter");

r = v(base({ limit: 80 }));
assert.equal(r.tick, "80%");
r = v(base({ limit: 100 }));
assert.equal(r.tick, null, "no tick at 100");
r = v(base({ limit: "unknown" }));
assert.equal(r.tick, null);

/* ---- lock, badge, driving -------------------------------------------------------- */

r = v(base({ lock: "locked" }));
assert.equal(r.lock, "locked");
assert.equal(r.lockIcon, "mdi:lock");
r = v(base({ lock: "unlocked" }));
assert.equal(r.lock, "open");
assert.equal(r.lockIcon, "mdi:lock-open-variant");
r = v(base({ lock: "jammed" }));
assert.equal(r.lock, null, "unknown lock state: hidden");

// sentry: on red, off grey, unknown hidden
r = v(base({ sentry: "on" }));
assert.equal(r.sentry, "on");
r = v(base({ sentry: "off" }));
assert.equal(r.sentry, "off", "off is shown too");
r = v(base({ sentry: "unavailable" }));
assert.equal(r.sentry, null);

// charging: only while charging, with the time to full as h:mm
r = v(base({ ch: "charging", ttf: 1.33 }));
assert.equal(r.charge, "1:20", "hours to h:mm");
r = v(base({ ch: "charging", ttf: 45, ttfUnit: "min" }));
assert.equal(r.charge, "0:45", "minutes");
r = v(base({ ch: "charging", ttf: 0 }));
assert.equal(r.charge, "", "0: bolt only");
r = v(base({ ch: "charging", ttf: "unknown" }));
assert.equal(r.charge, "", "unknown: bolt only");
r = v(base({ ch: "complete", ttf: 1 }));
assert.equal(r.charge, null, "not charging: no badge");
r = v(base({ ch: "disconnected", ttf: 2 }));
assert.equal(r.charge, null);

// update
r = v(base({ upd: "on" }));
assert(r.update);
r = v(base({ upd: "off" }));
assert(!r.update);
r = v(base({ upd: "unavailable" }));
assert(!r.update);

// all three at once
r = v(base({ sentry: "on", ch: "charging", ttf: 1.33, upd: "on" }));
assert.deepEqual([r.sentry, r.charge, r.update], ["on", "1:20", true]);
assert(r.pctInBar, "battery % sits at the end of the bar");

r = v(base({ drive: "on" }));
assert(r.driving);
r = v(base({ drive: "off" }));
assert(!r.driving);

/* ---- wheels ------------------------------------------------------------------ */
{
  // default picture: two wheel crops, placed from the default positions
  const c = render(base({ drive: "on" }));
  const wheels = c.shadowRoot.querySelectorAll(".wheel");
  assert.equal(wheels.length, 2, "front and rear wheel");
  const ar = 504 / 203;
  const front = wheels[0];
  assert.equal(front.style.left, "35.36%");
  assert.equal(parseFloat(front.style.top).toFixed(2), (71.28 - 22.41).toFixed(2));
  assert.equal(parseFloat(front.style.height).toFixed(2), (2 * 22.41).toFixed(2));
  const k = (0.0827 * ar) / 0.2241;
  assert.match(front.style.transform, new RegExp(`translateX\\(-50%\\) scaleX\\(${k.toFixed(4)}`), "squashed into its oval");
  const pic = front.querySelector(".spin img");
  assert.equal(pic.getAttribute("src"), "/local/teslam3.png?v=2", "the crop shows the same picture");
  // at rest the crop's picture puts the wheel centre in the middle of the circle
  const d = 2 * 0.2241;
  const left = parseFloat(pic.style.left) / 100, width = parseFloat(pic.style.width) / 100;
  assert(Math.abs(left + 0.3536 * width - 0.5) < 1e-6, "wheel centre x in the middle");
  const top = parseFloat(pic.style.top) / 100, height = parseFloat(pic.style.height) / 100;
  assert(Math.abs(top + 0.7128 * height - 0.5) < 1e-6, "wheel centre y in the middle");
  assert(Math.abs(height - 1 / d) < 1e-6);
  // a different aspect ratio once the picture has loaded moves the wheels with it
  c._placeWheels(2);
  assert.equal(c.shadowRoot.querySelectorAll(".wheel").length, 2, "replaced, not added");
  assert.equal(c._el.carbox.style.getPropertyValue("--tc-ar"), "2");
}
{
  // another picture: no default wheels, unless given
  let c = render(base(), { image: "/local/my-car.png" });
  assert.equal(c.shadowRoot.querySelectorAll(".wheel").length, 0, "default wheels only fit the default picture");
  c = render(base(), { image: "/local/my-car.png", wheels: [{ x: 20, y: 70, rx: 9, ry: 22 }] });
  assert.equal(c.shadowRoot.querySelectorAll(".wheel").length, 1);
  c = render(base(), { wheels: [] });
  assert.equal(c.shadowRoot.querySelectorAll(".wheel").length, 0, "wheels: [] switches them off");
  c = render(base(), { image: "/local/teslam3.png" });
  assert.equal(c.shadowRoot.querySelectorAll(".wheel").length, 2, "default picture without ?v=");
}

/* ---- config ------------------------------------------------------------------ */

r = v(base({ lock: "unlocked", sentry: "on", upd: "on" }), {
  name: "Calimero", image: "/local/car.png", entities: { lock: null, sentry: null, update: "update.other" },
});
assert.equal(r.name, "Calimero");
assert.equal(r.img, "/local/car.png");
assert.equal(r.lock, null, "null switches the lock off");
assert.equal(r.sentry, null, "null switches sentry off");
assert(!r.update, "update from a different, missing entity");

// the 0.2 badge sensors are ignored, not an error
{
  const c = render(base(), { entities: { badge_icon: "sensor.tesla_badge_icon", badge_color: "sensor.tesla_badge_color" } });
  assert(!("badge_icon" in c._config.entities));
  assert(!c._ids.includes("sensor.tesla_badge_icon"));
}

const bad = [
  [{ entities: { batery: "sensor.x" } }, /unknown role 'batery'/],
  [{ entities: { battery: "battery" } }, /not an entity id/],
  [{ entities: [] }, /entities must be a map/],
  [{ image: 5 }, /image must be a URL/],
  [{ colors: "red" }, /colors must be a map/],
  [{ entity: "sensor.x" }, /Unknown option 'entity'/],
  [{ wheels: "front" }, /wheels must be a list/],
  [{ wheels: [{ x: 1, y: 2, rx: 3 }] }, /wheels\[0\] needs numbers x, y, rx and ry/],
];
for (const [cfg, re] of bad) assert.throws(() => new Card().setConfig(cfg), re);
assert.deepEqual(Card.getStubConfig(), {});
assert.deepEqual(new Card().getGridOptions(), { columns: 6, rows: 2, min_columns: 4, min_rows: 2 });
{
  const c = render(base(), { colors: { battery: "teal", nope: "red" } });
  assert.equal(c.style.getPropertyValue("--tc-battery"), "teal");
}

/* ---- re-render only for own entities --------------------------------------------- */
{
  const states = base();
  const c = render(states);
  let n = 0;
  const orig = c._update.bind(c);
  c._update = () => { n++; orig(); };
  c.hass = hass({ ...states, "sensor.other": st(1) });
  assert.equal(n, 0, "foreign entity ignored");
  c.hass = hass({ ...states, "sensor.calimero_battery_level": st(79) });
  assert.equal(n, 1, "own entity re-renders");
}

/* ---- actions ---------------------------------------------------------------- */
{
  const c = render(base(), { hold_action: { action: "navigate", navigation_path: "#tesla" } });
  const got = [];
  c.addEventListener("hass-action", (e) => got.push(e.detail));
  c._el.card.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter" }));
  assert.equal(got[0].action, "tap");
  assert.deepEqual(got[0].config.tap_action, { action: "more-info" });
  assert.equal(got[0].config.entity, "binary_sensor.calimero_status");
  const PE = w.PointerEvent || w.MouseEvent;
  c._el.card.dispatchEvent(new PE("pointerdown", { button: 0, clientX: 1, clientY: 1 }));
  setTimeout(() => {
    c._el.card.dispatchEvent(new PE("pointerup", { button: 0 }));
    assert.equal(got.length, 2);
    assert.equal(got[1].action, "hold");
    assert.deepEqual(got[1].config.hold_action, { action: "navigate", navigation_path: "#tesla" });
    editorTests().then(() => {
      console.log("ALL OK");
      process.exit(0);
    }).catch((err) => { console.error(err); process.exit(1); });
  }, 600);
}

async function editorTests() {
  const Editor = w.customElements.get("tesla-model3-card-editor");
  assert(Editor, "editor registered");
  assert.equal(Card.getConfigElement().tagName.toLowerCase(), "tesla-model3-card-editor");

  // the minimal config shows every default entity
  const d0 = Editor.toData({ type: "custom:tesla-model3-card", grid_options: { columns: 6, rows: 2 } });
  assert.equal(d0.entities.battery, "sensor.calimero_battery_level");
  assert.equal(d0.entities.lock, "lock.calimero_lock");
  assert.equal(d0.name, "Tesla");
  // and unchanged it writes back nothing but what was there
  const minimal = { type: "custom:tesla-model3-card", grid_options: { columns: 6, rows: 2 } };
  assert.deepEqual(Editor.toConfig(d0, minimal), minimal);

  // changed entity is written, cleared one becomes null, null shows as empty
  const d1 = Editor.toData(minimal);
  d1.entities.battery = "sensor.other_battery";
  d1.entities.lock = "";
  const c1 = Editor.toConfig(d1, minimal);
  assert.deepEqual(c1.entities, { battery: "sensor.other_battery", lock: null });
  assert.equal(Editor.toData(c1).entities.lock, "");
  assert.deepEqual(Editor.toConfig(Editor.toData(c1), c1), c1, "round trip");

  // name, image, actions, colours; unknown keys such as wheels kept
  const full = {
    type: "custom:tesla-model3-card", name: "Calimero", image: "/local/car.png",
    wheels: [{ x: 1, y: 2, rx: 3, ry: 4 }], tap_action: { action: "navigate", navigation_path: "#tesla" },
    colors: { battery: "teal" }, entities: { status: "sensor.s" },
  };
  assert.deepEqual(Editor.toConfig(Editor.toData(full), full), full);

  // colour pickers: [r, g, b] in the form, hex in the YAML
  const d2 = Editor.toData(full);
  assert.deepEqual(d2.colors.battery, [76, 175, 80], "a name shows the default in the picker");
  assert.deepEqual(d2.colors.unlocked, [244, 67, 54], "unset shows the default");
  d2.colors.battery = [0, 128, 255];
  assert.deepEqual(Editor.toConfig(d2, full).colors, { battery: "#0080ff" }, "picked colour as hex");
  d2.colors.update = [33, 150, 243];
  assert.equal(Editor.toConfig(d2, full).colors.update, undefined, "default not written");
  const hexed = { type: "custom:tesla-model3-card", colors: { locked: "#abc", sentry_on: [1, 2, 3], nope: "red" } };
  const d3 = Editor.toData(hexed);
  assert.deepEqual(d3.colors.locked, [170, 187, 204]);
  assert.deepEqual(Editor.toConfig(d3, hexed).colors, hexed.colors, "untouched kept as written, unknown keys kept");
  d3.colors.locked = [76, 175, 80];
  assert.equal(Editor.toConfig(d3, hexed).colors.locked, "#4caf50");
  d3.colors.locked = [155, 155, 155];
  assert.equal(Editor.toConfig(d3, hexed).colors.locked, undefined, "back to the default removes it");
  const rgbCard = render(base(), { colors: { sentry_on: [1, 2, 3] } });
  assert.equal(rgbCard.style.getPropertyValue("--tc-sentry-on"), "#010203", "[r, g, b] in YAML works");

  // a 0.2 config with the badge sensors loses them on the next save
  const old = { type: "custom:tesla-model3-card", entities: { badge_icon: "sensor.tesla_badge_icon", battery: "sensor.b" } };
  assert.deepEqual(Editor.toConfig(Editor.toData(old), old).entities, { battery: "sensor.b" });
  assert.equal(Editor.toData(old).entities.sentry, "switch.calimero_sentry_mode");

  // every config the editor writes is accepted by the card
  new Card().setConfig(c1);
  new Card().setConfig(Editor.toConfig(Editor.toData(full), full));

  // with a stub ha-form: renders and passes changes on
  w.customElements.define("ha-form", class extends w.HTMLElement {});
  const ed = new Editor();
  const got = [];
  ed.addEventListener("config-changed", (e) => got.push(e.detail.config));
  ed.setConfig(minimal);
  w.document.body.appendChild(ed);
  await new Promise((r) => setTimeout(r, 0));
  const form = ed.querySelector("ha-form");
  assert(form, "ha-form rendered");
  assert.equal(form.data.entities.range, "sensor.calimero_battery_range");
  assert.equal(form.computeLabel({ name: "driving" }), "Someone in the car (driving)");
  form.dispatchEvent(new w.CustomEvent("value-changed", { detail: { value: { ...form.data, name: "Model 3" } } }));
  assert.deepEqual(got[0], { ...minimal, name: "Model 3" });
}
