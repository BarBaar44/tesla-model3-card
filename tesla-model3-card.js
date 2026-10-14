/*
 * Tesla Model 3 Card
 * A compact Lovelace card for a Tesla: the car as the picture, its status,
 * battery and range, the charge limit, lock state and one attention badge.
 *
 * Sized for half a sections column (6 columns by 2 rows, about 120px high)
 * next to Mushroom cards, with the same card background, rounding and type.
 * Plain JS, no dependencies, no card_mod, no Jinja; every entity overridable.
 *
 * https://github.com/BarBaar44/tesla-model3-card  (MIT)
 */

const VERSION = "0.2.0";

const HOLD_MS = 500;
const MOVE_TOLERANCE_PX = 10;

const TESLA_DEFAULTS = {
  name: "Tesla",
  image: "/local/teslam3.png?v=2",
  // Wheels of the default picture (504 x 203), in % of the picture's width (x, rx)
  // and height (y, ry). The wheels are drawn in perspective, so they are ovals.
  wheels: [
    { x: 35.36, y: 71.28, rx: 8.27, ry: 22.41 }, // front
    { x: 91.07, y: 64.90, rx: 5.58, ry: 18.97 }, // rear
  ],
  entities: {
    status: "sensor.tesla_status",
    badge_icon: "sensor.tesla_badge_icon",
    badge_color: "sensor.tesla_badge_color",
    battery: "sensor.calimero_battery_level",
    range: "sensor.calimero_battery_range",
    charge_limit: "number.calimero_charge_limit",
    charging: "sensor.calimero_charging",
    driving: "binary_sensor.calimero_user_present",
    lock: "lock.calimero_lock",
    more_info: "binary_sensor.calimero_status",
  },
};

/* colors key -> CSS variable and default. */
const TESLA_COLORS = {
  battery: ["--tc-battery", "var(--green-color, #4caf50)"],
  battery_medium: ["--tc-battery-medium", "var(--amber-color, #ffc107)"],
  battery_low: ["--tc-battery-low", "var(--red-color, #f44336)"],
  charging: ["--tc-charging", "var(--yellow-color, #ffeb3b)"],
  limit: ["--tc-limit", "var(--primary-text-color, #e1e1e1)"],
  locked: ["--tc-locked", "var(--secondary-text-color, #9b9b9b)"],
  unlocked: ["--tc-unlocked", "var(--red-color, #f44336)"],
};

/* Badge colour names as the badge sensor reports them. Anything else is used as CSS. */
const TESLA_BADGE_COLORS = {
  red: "var(--red-color, #f44336)", yellow: "var(--yellow-color, #ffeb3b)", green: "var(--green-color, #4caf50)",
  amber: "var(--amber-color, #ffc107)", orange: "var(--orange-color, #ff9800)", blue: "var(--blue-color, #2196f3)",
  grey: "var(--grey-color, #9e9e9e)",
};

const TESLA_BAD = ["unknown", "unavailable", "none", ""];
const teslaNum = (v) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? null : Number(v));

const TESLA_STYLE = `
  :host {
${Object.values(TESLA_COLORS).map(([v, d]) => `    ${v}: ${d};`).join("\n")}
    display: block; height: 100%;
  }
  ha-card {
    height: 100%; box-sizing: border-box; overflow: hidden; cursor: pointer;
    padding: 8px 12px 10px;
    display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto auto auto;
    -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; touch-action: manipulation;
  }
  ha-card.pressed { opacity: .8; }
  ha-card:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }

  /* The car: as large as the space left above the text allows, never wider than the card.
     The box keeps the picture's aspect ratio, so the wheels can be placed in % of it. */
  .car { min-height: 0; overflow: hidden; display: flex; justify-content: center; align-items: flex-end; container-type: size; }
  .carbox { position: relative; flex: none; aspect-ratio: var(--tc-ar, 2.483);
    width: min(100cqw, calc(100cqh * var(--tc-ar, 2.483))); }
  .carbox > img { display: block; width: 100%; height: 100%; }
  .carbox.missing { visibility: hidden; }

  /* Spinning wheels: a round crop of each wheel, squashed back into its oval. Only while driving. */
  .wheel { display: none; position: absolute; aspect-ratio: 1; }
  .driving .wheel { display: block; }
  .wheel .spin { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; }
  .wheel .spin img { position: absolute; display: block; max-width: none; }
  .driving .wheel .spin { animation: tc-spin .5s linear infinite; }
  /* The picture faces left, so the wheels turn counter-clockwise. */
  @keyframes tc-spin { to { transform: rotate(-360deg); } }
  /* And the body bobs a little on its suspension. */
  .driving .carbox { animation: tc-bob .45s ease-in-out infinite alternate; transform-origin: 60% 85%; }
  @keyframes tc-bob {
    from { transform: translateY(0) rotate(0deg); }
    to { transform: translateY(-1.2px) rotate(-.4deg); }
  }

  /* Text: Mushroom sizes. */
  .line { display: flex; align-items: center; justify-content: space-between; gap: 6px; min-width: 0; }
  .line.l1 { margin-top: 2px; }
  .name { display: flex; align-items: center; gap: 5px; min-width: 0; flex: 0 1 auto; }
  .p { font-size: 14px; font-weight: 500; line-height: 18px; color: var(--primary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .s { font-size: 12px; line-height: 16px; color: var(--secondary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
  .status { flex: 0 1 auto; min-width: 0; }
  .num { flex: none; }

  /* Small icons always get an explicit size. */
  .lock { display: none; flex: none; width: 14px; height: 14px; color: var(--tc-locked); }
  .lock.show { display: flex; }
  .lock.open { color: var(--tc-unlocked); }
  .lock ha-icon { --mdc-icon-size: 14px; width: 14px; height: 14px; display: flex; }
  .badge { display: none; flex: none; width: 16px; height: 16px; border-radius: 50%;
    align-items: center; justify-content: center; color: var(--b); background: color-mix(in srgb, var(--b) 24%, transparent); }
  .badge.show { display: flex; }
  .badge ha-icon { --mdc-icon-size: 11px; width: 11px; height: 11px; display: flex; }

  .bar { position: relative; height: 5px; margin-top: 6px; border-radius: 3px;
    background: color-mix(in srgb, var(--secondary-text-color) 22%, transparent); }
  .bar.hide { visibility: hidden; }
  .fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; border-radius: 3px; background: var(--bc); transition: width .4s; }
  .charging .fill { animation: tc-pulse 1.6s ease-in-out infinite; }
  @keyframes tc-pulse { 50% { opacity: .45; } }
  .tick { display: none; position: absolute; top: -2px; width: 2px; height: 9px; margin-left: -1px; border-radius: 1px; background: var(--tc-limit); opacity: .85; }
  .tick.show { display: block; }

  @media (prefers-reduced-motion: reduce) {
    .driving .carbox, .driving .wheel .spin, .charging .fill { animation: none; }
    .driving .wheel { display: none; }
    .fill { transition: none; }
  }
`;

class TeslaModel3Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._seen = Object.create(null);
    this._ids = [];
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const c = config || {};
    const known = ["type", "name", "image", "wheels", "entities", "tap_action", "hold_action", "colors",
      "grid_options", "layout_options", "view_layout", "visibility", "card_mod"];
    for (const k of Object.keys(c)) {
      if (!known.includes(k)) throw new Error(`Unknown option '${k}'. Known: ${known.slice(1, 7).join(", ")}`);
    }
    const ent = c.entities == null ? {} : c.entities;
    if (typeof ent !== "object" || Array.isArray(ent)) throw new Error("entities must be a map, e.g. battery: sensor.my_battery");
    for (const [k, v] of Object.entries(ent)) {
      if (!(k in TESLA_DEFAULTS.entities)) {
        throw new Error(`entities: unknown role '${k}'. Known: ${Object.keys(TESLA_DEFAULTS.entities).join(", ")}`);
      }
      if (v !== null && (typeof v !== "string" || !/^[a-z0-9_]+\.[a-z0-9_]+$/.test(v))) {
        throw new Error(`entities.${k}: '${v}' is not an entity id (null switches it off)`);
      }
    }
    if (c.image != null && typeof c.image !== "string") throw new Error("image must be a URL, e.g. /local/teslam3.png");
    if (c.colors != null && (typeof c.colors !== "object" || Array.isArray(c.colors))) {
      throw new Error("colors must be a map, e.g. battery: green");
    }
    const image = c.image == null ? TESLA_DEFAULTS.image : c.image;
    // Default wheel positions only fit the default picture.
    let wheels = c.wheels;
    if (wheels == null) wheels = /(^|\/)teslam3\.png(\?|$)/.test(image) ? TESLA_DEFAULTS.wheels : [];
    if (!Array.isArray(wheels)) throw new Error("wheels must be a list of { x, y, rx, ry } in % of the picture");
    wheels.forEach((wh, i) => {
      if (!wh || typeof wh !== "object" || ["x", "y", "rx", "ry"].some((k) => teslaNum(wh[k]) === null)) {
        throw new Error(`wheels[${i}] needs numbers x, y, rx and ry (in % of the picture)`);
      }
    });
    const entities = { ...TESLA_DEFAULTS.entities, ...ent };
    this._config = {
      name: c.name == null ? TESLA_DEFAULTS.name : String(c.name),
      image,
      wheels: wheels.map((wh) => ({ x: +wh.x, y: +wh.y, rx: +wh.rx, ry: +wh.ry })),
      entities,
      tap_action: c.tap_action || { action: "more-info" },
      hold_action: c.hold_action || { action: "more-info" },
      colors: c.colors || {},
    };
    this._applyColors(this._config.colors);
    this._ids = [...new Set(Object.values(entities).filter(Boolean))];
    this._seen = Object.create(null);
    this._build();
    if (this._hass) this._update();
  }

  _applyColors(colors) {
    Object.keys(colors).forEach((k) => {
      if (!TESLA_COLORS[k]) console.warn(`tesla-model3-card: unknown colors key "${k}". Known: ${Object.keys(TESLA_COLORS).join(", ")}`);
    });
    Object.entries(TESLA_COLORS).forEach(([k, [v]]) => {
      const val = typeof colors[k] === "string" && colors[k].trim() ? colors[k].trim() : null;
      if (val) this.style.setProperty(v, val);
      else this.style.removeProperty(v);
    });
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    let changed = first;
    for (const id of this._ids) {
      const s = hass.states[id];
      if (s !== this._seen[id]) {
        this._seen[id] = s;
        changed = true;
      }
    }
    if (changed) this._update();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: 6, rows: 2, min_columns: 4, min_rows: 2 };
  }

  /* ---- DOM, built once per config ---------------------------------------- */

  _build() {
    this.shadowRoot.innerHTML = `
      <style>${TESLA_STYLE}</style>
      <ha-card role="button" tabindex="0">
        <div class="car"><div class="carbox"><img alt=""></div></div>
        <div class="line l1">
          <span class="name"><span class="p"></span>
            <span class="lock"><ha-icon></ha-icon></span>
            <span class="badge"><ha-icon></ha-icon></span>
          </span>
          <span class="s num pct"></span>
        </div>
        <div class="line">
          <span class="s status"></span>
          <span class="s num range"></span>
        </div>
        <div class="bar"><div class="fill"></div><div class="tick"></div></div>
      </ha-card>`;
    const $ = (s) => this.shadowRoot.querySelector(s);
    this._el = {
      card: $("ha-card"), carbox: $(".carbox"), img: $(".carbox > img"), name: $(".p"),
      lock: $(".lock"), lockIcon: $(".lock ha-icon"), badge: $(".badge"), badgeIcon: $(".badge ha-icon"),
      pct: $(".pct"), status: $(".status"), range: $(".range"),
      bar: $(".bar"), fill: $(".fill"), tick: $(".tick"),
    };
    this._el.name.textContent = this._config.name;
    const img = this._el.img;
    const box = this._el.carbox;
    img.addEventListener("error", () => box.classList.add("missing"));
    img.addEventListener("load", () => {
      box.classList.remove("missing");
      if (img.naturalWidth && img.naturalHeight) this._placeWheels(img.naturalWidth / img.naturalHeight);
    });
    img.src = this._config.image;
    this._placeWheels(504 / 203);
    this._bindPress(this._el.card);
  }

  /*
   * Puts a round, rotatable crop of the picture over each wheel. Each wheel is
   * an oval (rx by ry); the crop is a circle of diameter 2 * ry, squashed
   * horizontally by k = rx / ry, and the picture inside it is stretched by 1 / k,
   * so at rest it matches the picture exactly and it turns as a round wheel.
   * ar = picture width / height. All values are in % of the car box.
   */
  _placeWheels(ar) {
    const box = this._el.carbox;
    box.style.setProperty("--tc-ar", String(ar));
    box.querySelectorAll(".wheel").forEach((el) => el.remove());
    for (const wh of this._config.wheels) {
      const x = wh.x / 100, y = wh.y / 100, rx = wh.rx / 100, ry = wh.ry / 100;
      if (rx <= 0 || ry <= 0) continue;
      const k = (rx * ar) / ry; // oval width / height in pixels
      const d = 2 * ry; // circle diameter, as a fraction of the box height
      const el = document.createElement("div");
      el.className = "wheel";
      el.style.left = `${x * 100}%`;
      el.style.top = `${(y - ry) * 100}%`;
      el.style.height = `${d * 100}%`;
      el.style.transform = `translateX(-50%) scaleX(${k})`;
      const pic = document.createElement("img");
      pic.alt = "";
      pic.src = this._config.image;
      // Picture position inside the circle, before the squash (fractions of the diameter).
      const left = 0.5 - (x * ar) / (d * k);
      const top = 0.5 - y / d;
      pic.style.left = `${left * 100}%`;
      pic.style.top = `${top * 100}%`;
      pic.style.width = `${(ar / (d * k)) * 100}%`;
      pic.style.height = `${(1 / d) * 100}%`;
      const spin = document.createElement("div");
      spin.className = "spin";
      spin.appendChild(pic);
      el.appendChild(spin);
      box.appendChild(el);
    }
  }

  /* ---- actions ------------------------------------------------------------ */

  _bindPress(el) {
    let timer = null;
    let start = null;
    let held = false;
    const cancel = () => {
      clearTimeout(timer);
      timer = null;
      start = null;
      el.classList.remove("pressed");
    };
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      held = false;
      start = { x: e.clientX, y: e.clientY };
      el.classList.add("pressed");
      timer = setTimeout(() => {
        timer = null;
        held = true;
        el.classList.remove("pressed");
        this._run("hold");
      }, HOLD_MS);
    });
    el.addEventListener("pointermove", (e) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancel();
    });
    el.addEventListener("pointerup", () => {
      if (!start) return;
      const wasHeld = held;
      cancel();
      if (!wasHeld) this._run("tap");
    });
    el.addEventListener("pointercancel", cancel);
    el.addEventListener("pointerleave", cancel);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      this._run("tap");
    });
  }

  /* Hands the action to Home Assistant's own handler, like built-in cards do. */
  _run(kind) {
    const c = this._config;
    const conf = kind === "hold" ? c.hold_action : c.tap_action;
    if (!conf || conf.action === "none") return;
    window.dispatchEvent(new CustomEvent("haptic", { detail: kind === "hold" ? "medium" : "light" }));
    this.dispatchEvent(new CustomEvent("hass-action", {
      bubbles: true, composed: true,
      detail: { config: { entity: c.entities.more_info, tap_action: c.tap_action, hold_action: c.hold_action }, action: kind },
    }));
  }

  /* ---- state -------------------------------------------------------------- */

  _s(role) {
    const id = this._config.entities[role];
    return id && this._hass ? this._hass.states[id] : undefined;
  }

  _val(role) {
    const s = this._s(role);
    const v = s ? String(s.state).trim() : "";
    return TESLA_BAD.includes(v.toLowerCase()) ? null : v;
  }

  _update() {
    if (!this._hass || !this._el) return;
    const e = this._el;
    const set = (el, text) => { if (el.textContent !== text) el.textContent = text; };

    // Status, trimmed
    const status = this._val("status") || "";
    set(e.status, status);
    e.status.title = status;

    // Battery and range
    const pct = teslaNum(this._val("battery"));
    set(e.pct, pct === null ? "" : `${Math.round(pct)}%`);
    const rangeState = this._s("range");
    const range = teslaNum(this._val("range"));
    const unit = (rangeState && rangeState.attributes && rangeState.attributes.unit_of_measurement) || "km";
    set(e.range, range === null ? "" : `${Math.round(range)} ${unit}`);

    const charging = String(this._val("charging") || "").toLowerCase() === "charging";
    let colour = "--tc-battery";
    if (charging) colour = "--tc-charging";
    else if (pct !== null && pct < 20) colour = "--tc-battery-low";
    else if (pct !== null && pct < 50) colour = "--tc-battery-medium";
    e.card.classList.toggle("charging", charging);
    e.bar.classList.toggle("hide", pct === null);
    e.fill.style.setProperty("--bc", `var(${colour})`);
    e.fill.style.width = `${pct === null ? 0 : Math.max(0, Math.min(100, pct))}%`;

    const limit = teslaNum(this._val("charge_limit"));
    e.tick.classList.toggle("show", limit !== null && limit > 0 && limit < 100);
    if (limit !== null) e.tick.style.left = `${Math.max(0, Math.min(100, limit))}%`;

    // Lock: grey when locked, red when unlocked, hidden when unknown
    const lock = String(this._val("lock") || "").toLowerCase();
    const known = lock === "locked" || lock === "unlocked";
    e.lock.classList.toggle("show", known);
    e.lock.classList.toggle("open", lock === "unlocked");
    if (known) {
      const icon = lock === "locked" ? "mdi:lock" : "mdi:lock-open-variant";
      if (e.lockIcon.getAttribute("icon") !== icon) e.lockIcon.setAttribute("icon", icon);
      e.lock.title = lock === "locked" ? "Locked" : "Unlocked";
    }

    // Badge: icon and colour from their sensors, both empty means none
    const bIcon = this._val("badge_icon");
    const bColour = this._val("badge_color");
    const showBadge = !!bIcon && /^[a-z0-9_-]+:[a-z0-9-]+$/i.test(bIcon);
    e.badge.classList.toggle("show", showBadge);
    if (showBadge) {
      if (e.badgeIcon.getAttribute("icon") !== bIcon) e.badgeIcon.setAttribute("icon", bIcon);
      const c = bColour ? TESLA_BADGE_COLORS[bColour.toLowerCase()] || bColour : "var(--secondary-text-color)";
      e.badge.style.setProperty("--b", c);
    }

    // Driving
    const s = this._s("driving");
    e.card.classList.toggle("driving", !!s && s.state === "on");

    e.card.setAttribute("aria-label", [this._config.name, status, pct === null ? "" : `${Math.round(pct)}%`].filter(Boolean).join(", "));
  }
}

if (!customElements.get("tesla-model3-card")) {
  customElements.define("tesla-model3-card", TeslaModel3Card);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "tesla-model3-card")) {
  window.customCards.push({
    type: "tesla-model3-card",
    name: "Tesla Model 3 Card",
    description: "Compact Tesla card: car picture, status, battery bar with charge limit, range, lock and badge.",
    preview: true,
    documentationURL: "https://github.com/BarBaar44/tesla-model3-card",
  });
}

console.info(`%c TESLA-MODEL3-CARD %c ${VERSION} `, "background:#e82127;color:#fff", "");
