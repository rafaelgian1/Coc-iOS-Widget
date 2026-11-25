// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: hammer;

/*
 * CoC Upgrade Tracker — Scriptable script
 *
 * Unofficial fan project. This material is unofficial and is not endorsed by
 * Supercell. For more information see Supercell's Fan Content Policy:
 * www.supercell.com/fan-content-policy
 *
 * Credits: item pictures, game data and the free API proxy by ClashKing
 * (clashk.ing). Optional key route via RoyaleAPI's proxy (cocproxy.royaleapi.dev).
 *
 * What it does
 *   • Reads the Clash of Clans "Data Export" from your clipboard
 *     (Settings → More Settings → Data Export → Copy)
 *   • Remembers every account by its player tag (up to as many as you like)
 *   • Schedules an iPhone notification for every builder / lab / pet /
 *     Builder Base upgrade, at the exact moment it finishes
 *   • Draws a home-screen widget (small / medium / large) for all accounts
 *
 * How it runs
 *   • From a Shortcuts automation ("When Clash of Clans is closed")
 *       → silently imports the clipboard if it holds a new export
 *   • Tapping the script in Scriptable
 *       → imports the clipboard (if new), then shows a menu
 *         (view upgrades, rename accounts, builder count, test alert…)
 *   • As a widget → shows the dashboard.
 *       Widget Parameter (optional): an account name, e.g.  Main
 *       → that widget shows only that account, with every upgrade listed.
 *
 * Town Hall 19 (Nov 2026): names and pictures for everything new (Spiky Tower,
 *   Firecracker Tower, Squad Barracks, Guardian Shrine, the 12 Squads, Heroic Spell,
 *   Dragon Duke, Guardians, crafted defenses…), Squads in the Laboratory, the new
 *   upgrade times, supercharges only where they still exist, Goblin / helper flags,
 *   B.O.B's builder, and the Gold Pass boosts read from each export.
 *
 * Patched version:
 *   • Progress bars count the real work left, so they stay correct while a
 *     potion, snack or helper is speeding an upgrade up.
 *   • ⏳ Time reduction: an event (Hammer Jam, Summer Jam…) plus the Gold Pass
 *     Builder / Research Boost (set per account), combined the way the game does (they multiply:
 *     50% + 20% = 60% shorter), so bars of upgrades started during them are right.
 *   • Lighter war checks inside the widget (shorter timeout, 30-min cache).
 */

// ───────────────────────── Settings you can change ─────────────────────────

// Send a quick "✅ updated" notification each time an export is imported.
const CONFIRM_IMPORT = true;

// What tapping a notification or an upgrade row opens.
// "clashofclans://" opens the game directly.
const CLASH_URL = "clashofclans://";

// Title shown at the top of every widget.
const HEADING = "COC UPGRADES";

// Quick-pick names offered when you rename an account.
const NAME_SUGGESTIONS = []; // e.g. ["Main", "Mini 1", "Mini 2"] — quick picks when renaming

// Optional: fetch fuller item names from ClashKing's public game data.
// If it can't be reached, the built-in names below are used instead.
const REMOTE_NAME_URLS = [
  "https://assets.clashk.ing/static_data.json",
  "https://assets.clashk.ing/static_data",
];

// ─────────────────────────── Built-in item names ───────────────────────────
// Export "data" id → name, from ClashKing's game data for Town Hall 19 (Nov 2026).
// Anything missing is looked up in ClashKing's live data, else shown as a generic label.
const NAMES = {
  // Home Village buildings
  1000000: "Army Camp", 1000001: "Town Hall", 1000002: "Elixir Collector", 1000003: "Elixir Storage",
  1000004: "Gold Mine", 1000005: "Gold Storage", 1000006: "Barracks", 1000007: "Laboratory", 1000008: "Cannon",
  1000009: "Archer Tower", 1000010: "Wall", 1000011: "Wizard Tower", 1000012: "Air Defense", 1000013: "Mortar",
  1000014: "Clan Castle", 1000015: "Builder's Hut", 1000019: "Hidden Tesla", 1000020: "Spell Factory",
  1000021: "X-Bow", 1000023: "Dark Elixir Drill", 1000024: "Dark Elixir Storage", 1000026: "Dark Barracks",
  1000027: "Inferno Tower", 1000028: "Air Sweeper", 1000029: "Dark Spell Factory", 1000031: "Eagle Artillery",
  1000032: "Bomb Tower", 1000059: "Workshop", 1000064: "B.O.B's Hut", 1000067: "Scattershot",
  1000068: "Pet House", 1000070: "Blacksmith", 1000071: "Hero Hall", 1000072: "Spell Tower",
  1000077: "Monolith", 1000079: "Multi-Gear Tower", 1000084: "Multi-Archer Tower", 1000085: "Ricochet Cannon",
  1000086: "Revenge Tower", 1000089: "Firespitter", 1000093: "Helper Hut", 1000097: "Crafting Station",
  1000102: "Super Wizard Tower", 1000105: "Guardian Shrine", 1000106: "Squad Barracks", 1000107: "Spiky Tower",
  1000108: "Firecracker Tower",
  // Builder Base buildings
  1000033: "Wall", 1000034: "Builder Hall", 1000035: "Elixir Collector", 1000036: "Elixir Storage",
  1000037: "Gold Mine", 1000038: "Gold Storage", 1000039: "Clock Tower", 1000040: "Builder Barracks",
  1000041: "Double Cannon", 1000042: "Army Camp", 1000043: "Hidden Tesla", 1000044: "Cannon",
  1000045: "Multi Mortar", 1000046: "Star Laboratory", 1000047: "B.O.T.O’s Shack", 1000048: "Archer Tower",
  1000049: "Reinforcement Camp", 1000050: "Firecrackers", 1000051: "Guard Post", 1000052: "Mega Tesla",
  1000053: "Battle Machine", 1000054: "Air Bombs", 1000055: "Crusher", 1000056: "Roaster",
  1000057: "Giant Cannon", 1000058: "Gem Mine", 1000063: "Lava Launcher", 1000065: "B.O.B Control",
  1000078: "O.T.T.O's Outpost", 1000080: "Battle Copter", 1000081: "X-Bow", 1000082: "Healing Hut",
  // Traps
  12000000: "Bomb", 12000001: "Spring Trap", 12000002: "Giant Bomb", 12000005: "Air Bomb",
  12000006: "Seeking Air Mine", 12000008: "Skeleton Trap", 12000010: "Spring Trap", 12000011: "Push Trap",
  12000013: "Mine", 12000014: "Mega Mine", 12000016: "Tornado Trap", 12000020: "Giga Bomb",
  // Crafting Station defenses and their modules (crafted defenses)
  102000033: "Hot Candle Hitpoints", 102000034: "Hot Candle Damage", 102000035: "Hot Candle Duration",
  102000036: "Hero Hunter Hitpoints", 102000037: "Hero Hunter Damage", 102000038: "Hero Hunter Poison Effect",
  102000039: "Cake-A-Pult Hitpoints", 102000040: "Cake-A-Pult Damage", 102000041: "Cake-A-Pult Splash Damage",
  103000011: "Hot Candle", 103000012: "Hero Hunter", 103000013: "Cake-A-Pult",
  // Heroes
  28000000: "Barbarian King", 28000001: "Archer Queen", 28000002: "Grand Warden", 28000003: "Battle Machine",
  28000004: "Royal Champion", 28000005: "Battle Copter", 28000006: "Minion Prince", 28000007: "Dragon Duke",
  // Guardians (upgraded at the Guardian Shrine)
  107000000: "Longshot", 107000001: "Smasher", 107000008: "Logger",
  // Pets
  73000000: "L.A.S.S.I", 73000001: "Mighty Yak", 73000002: "Electro Owl", 73000003: "Unicorn",
  73000004: "Phoenix", 73000007: "Poison Lizard", 73000008: "Diggy", 73000009: "Frosty",
  73000010: "Spirit Fox", 73000011: "Angry Jelly", 73000016: "Sneezy", 73000017: "Greedy Raven",
  // Troops, Squads & siege machines (Home Village)
  4000000: "Barbarian", 4000001: "Archer", 4000002: "Goblin", 4000003: "Giant", 4000004: "Wall Breaker",
  4000005: "Balloon", 4000006: "Wizard", 4000007: "Healer", 4000008: "Dragon", 4000009: "P.E.K.K.A",
  4000010: "Minion", 4000011: "Hog Rider", 4000012: "Valkyrie", 4000013: "Golem", 4000015: "Witch",
  4000017: "Lava Hound", 4000022: "Bowler", 4000023: "Baby Dragon", 4000024: "Miner", 4000051: "Wall Wrecker",
  4000052: "Battle Blimp", 4000053: "Yeti", 4000058: "Ice Golem", 4000059: "Electro Dragon",
  4000062: "Stone Slammer", 4000065: "Dragon Rider", 4000075: "Siege Barracks", 4000082: "Headhunter",
  4000087: "Log Launcher", 4000091: "Flame Flinger", 4000092: "Battle Drill", 4000095: "Electro Titan",
  4000097: "Apprentice Warden", 4000109: "Ruin Witch", 4000110: "Root Rider", 4000123: "Druid",
  4000132: "Thrower", 4000135: "Troop Launcher", 4000150: "Furnace", 4000177: "Meteor Golem",
  4000188: "Sky Wagon", 4000195: "Barch Squad", 4000196: "Giant Wizard Squad", 4000197: "Wall Breaker Squad",
  4000198: "Minion Squad", 4000199: "Balloon Squad", 4000200: "Golem Witch Squad", 4000201: "Hog Rider Squad",
  4000202: "Miner Squad", 4000203: "Healer Squad", 4000204: "P.E.K.K.A Titan Squad", 4000205: "Dragons Squad",
  4000206: "Baby Dragon Squad",
  // Builder Base troops
  4000031: "Raged Barbarian", 4000032: "Sneaky Archer", 4000033: "Beta Minion", 4000034: "Boxer Giant",
  4000035: "Bomber", 4000036: "Power P.E.K.K.A", 4000037: "Cannon Cart", 4000038: "Drop Ship",
  4000041: "Baby Dragon", 4000042: "Night Witch", 4000070: "Hog Glider", 4000106: "Electrofire Wizard",
  // Spells
  26000000: "Lightning Spell", 26000001: "Healing Spell", 26000002: "Rage Spell", 26000003: "Jump Spell",
  26000005: "Freeze Spell", 26000009: "Poison Spell", 26000010: "Earthquake Spell", 26000011: "Haste Spell",
  26000016: "Clone Spell", 26000017: "Skeleton Spell", 26000028: "Bat Spell", 26000035: "Invisibility Spell",
  26000053: "Recall Spell", 26000070: "Overgrowth Spell", 26000098: "Revive Spell",
  26000109: "Ice Block Spell", 26000120: "Totem Spell", 26000123: "Angry Spell", 26000153: "Heroic Spell",
  // Helpers
  93000000: "Builder's Apprentice", 93000001: "Lab Assistant", 93000002: "Alchemist", 93000003: "Prospector",
};

const BUILDERS_HUT = 1000015, TOWN_HALL = 1000001, BUILDER_HALL = 1000034, BOB_HUT = 1000064, CLOCK_TOWER = 1000039;

// Categories: builder (home builders, incl. heroes), lab, pets, bb (Builder Base / Master Builder), starlab, other
const CAT = {
  builder: { emoji: "🔨", generic: "Building upgrade", free: "Builder free" },
  lab:     { emoji: "⚗️", generic: "Lab research",     free: "Laboratory free" },
  pets:    { emoji: "🐾", generic: "Pet upgrade",      free: "Pet House free" },
  bb:      { emoji: "🛠️", generic: "Builder Base upgrade", free: "Master Builder free" },
  starlab: { emoji: "🔭", generic: "Star Lab research", free: "Star Laboratory free" },
  other:   { emoji: "⏱️", generic: "Upgrade",          free: "Upgrade finished" },
};

// ─────────────────────────────── Storage ───────────────────────────────────

const NOTIF_PREFIX = "coc-tracker|";
const MAX_NOTIFS = 55; // iOS keeps at most 64 pending per app

let fm, DIR, DB_PATH, NAMES_CACHE_PATH;
function initStorage() {
  fm = FileManager.local();
  DIR = fm.joinPath(fm.documentsDirectory(), "coc-tracker");
  if (!fm.fileExists(DIR)) fm.createDirectory(DIR, true);
  DB_PATH = fm.joinPath(DIR, "accounts.json");
  NAMES_CACHE_PATH = fm.joinPath(DIR, "names-cache.json");
  SETTINGS_PATH = fm.joinPath(DIR, "settings.json");
  WARS_PATH = fm.joinPath(DIR, "wars.json");
  initIcons();
}

function loadDB() {
  try {
    if (fm.fileExists(DB_PATH)) {
      const db = JSON.parse(fm.readString(DB_PATH));
      if (db && db.accounts) {
        // Older versions didn't store upgrade lengths: count from the last sync.
        for (const a of Object.values(db.accounts))
          (a.items || []).forEach((it, i) => {
            // Older versions put upgrades of geared-up buildings under Builder Base.
            if (it.gear && it.src === "buildings") { it.gear = false; it.geared = true; it.cat = "builder"; }
            if (!it.dur && a.lastExport) it.dur = Math.max(it.end - a.lastExport, knownDuration(it, it.end - a.lastExport));
            if (!it.uid) it.uid = `${it.id}_${it.to}_x${i}`;
          });
        return db;
      }
    }
  } catch (e) { /* fall through */ }
  return { accounts: {} };
}
function saveDB(db) { fm.writeString(DB_PATH, JSON.stringify(db)); }

let REMOTE_NAMES = {}, REMOTE_DURS = {}, REMOTE_ICONS = {}, REMOTE_SECT = {};
let REMOTE_MAX = {}, REMOTE_SC = {}, REMOTE_PARENT = {}, REMOTE_NOUP = {}, FULL_SEEN = {};
let REMOTE_REQ = {}, REMOTE_VIL = {}, REMOTE_UNLOCKS = {};
// 5: Town Hall 19 data, and upgrade lengths stored as "time to reach level N".
// 6: + Town Hall needed per level, village, Town Hall unlocks (for "progress to max").
const CACHE_VERSION = 6;
function loadNameCache() {
  try {
    if (fm.fileExists(NAMES_CACHE_PATH)) {
      const c = JSON.parse(fm.readString(NAMES_CACHE_PATH));
      REMOTE_NAMES = c.names || {};
      REMOTE_ICONS = c.icons || {};
      REMOTE_SECT = c.sect || {};
      // Older caches stored the lengths the other way round: only trust version 5+.
      const cur = c.v >= 5;
      REMOTE_DURS = cur ? c.durs || {} : {};
      REMOTE_MAX = cur ? c.max || {} : {};
      REMOTE_SC = cur ? c.sc || {} : {};
      REMOTE_PARENT = cur ? c.parent || {} : {};
      REMOTE_NOUP = cur ? c.noup || {} : {};
      REMOTE_REQ = c.v === CACHE_VERSION ? c.req || {} : {};
      REMOTE_VIL = c.v === CACHE_VERSION ? c.vil || {} : {};
      REMOTE_UNLOCKS = c.v === CACHE_VERSION ? c.unlocks || {} : {};
      return c;
    }
  } catch (e) { }
  return null;
}
function writeNameCache(fetched, v = CACHE_VERSION, retryAt = 0) {
  fm.writeString(NAMES_CACHE_PATH, JSON.stringify({ v, fetched, retryAt, names: REMOTE_NAMES, durs: REMOTE_DURS,
    icons: REMOTE_ICONS, sect: REMOTE_SECT, max: REMOTE_MAX, sc: REMOTE_SC, parent: REMOTE_PARENT, noup: REMOTE_NOUP,
    req: REMOTE_REQ, vil: REMOTE_VIL, unlocks: REMOTE_UNLOCKS }));
}

// Best-effort: refresh the game data from ClashKing at most once a week (right away
// after an update of this script). Returns true when newer data was loaded.
async function refreshRemoteNames() {
  const cache = loadNameCache();
  // Weekly; after an update of this script right away (a failed try then waits 6 hours).
  if (cache && cache.v === CACHE_VERSION && Date.now() - cache.fetched < 7 * 864e5) return false;
  if (cache && cache.v !== CACHE_VERSION && cache.retryAt && Date.now() < cache.retryAt) return false;
  const upgraded = !cache || cache.v !== CACHE_VERSION;
  for (const url of REMOTE_NAME_URLS) {
    try {
      const req = new Request(url);
      req.timeoutInterval = 12;
      const data = await req.loadJSON();
      const names = {}, durs = {};
      const keep = { REMOTE_ICONS, REMOTE_SECT, REMOTE_MAX, REMOTE_SC, REMOTE_PARENT, REMOTE_NOUP, REMOTE_REQ, REMOTE_VIL, REMOTE_UNLOCKS };
      REMOTE_ICONS = {}; REMOTE_SECT = {}; REMOTE_MAX = {}; REMOTE_SC = {}; REMOTE_PARENT = {}; REMOTE_NOUP = {};
      REMOTE_REQ = {}; REMOTE_VIL = {}; REMOTE_UNLOCKS = {};
      FULL_SEEN = {};
      collectNames(data, names, durs, 0, null);
      if (Object.keys(names).length <= 50) ({ REMOTE_ICONS, REMOTE_SECT, REMOTE_MAX, REMOTE_SC, REMOTE_PARENT, REMOTE_NOUP, REMOTE_REQ, REMOTE_VIL, REMOTE_UNLOCKS } = keep);
      if (Object.keys(names).length > 50) {
        REMOTE_NAMES = names; REMOTE_DURS = durs;
        writeNameCache(Date.now());
        // Bars picked with older data (or before Town Hall 19's new times): pick again.
        if (upgraded) try { repickDurations(); } catch (e) { }
        return true;
      }
    } catch (e) { /* try next / ignore */ }
  }
  // Remember the failed attempt so we don't retry on every run.
  if (cache && cache.v !== CACHE_VERSION) writeNameCache(cache.fetched || 0, cache.v, Date.now() + 6 * 36e5);
  else writeNameCache(Date.now());
  return false;
}
function collectNames(node, out, durs, depth, sect) {
  if (!node || typeof node !== "object" || depth > 6) return;
  if (Array.isArray(node)) { for (const n of node) collectNames(n, out, durs, depth + 1, sect); return; }
  const id = Number(node._id ?? node.id);
  // The same id also shows up in references, e.g. a Town Hall level's "unlocks" list
  // ({ name: "Air Defense", _id: … } with no levels). Only the item's own entry (the
  // one with levels) has its upgrade data, so that one always wins.
  const full = Array.isArray(node.levels);
  if (id > 999999 && typeof node.name === "string" && (!out[id] || (full && !FULL_SEEN[id]))) {
    out[id] = node.name;
    if (full) FULL_SEEN[id] = true;
    if (sect) REMOTE_SECT[id] = sect; // which category the game data files it under
    // Any picture link the data carries for this item.
    for (const [k, v] of Object.entries(node))
      if (typeof v === "string" && /\.(webp|png)(\?|$)/i.test(v) && /icon|image|img|url/i.test(k)) { REMOTE_ICONS[id] = v; break; }
    // Upgrade lengths per level, stored as "time to reach level N" (used for progress bars).
    // Buildings, traps and crafted modules give build_time = time to BUILD that level;
    // troops, spells, heroes, pets, guardians and Squads give upgrade_time = time to
    // go FROM that level to the next one.
    if (Array.isArray(node.levels)) {
      const lvls = node.levels.filter(lv => lv && typeof lv === "object");
      const build = lvls.some(lv => "build_time" in lv);
      const m = {}, req = {};
      let max = 0;
      lvls.forEach((lv, i) => {
        const level = Number(lv.level ?? lv.lvl ?? i + 1);
        max = Math.max(max, level);
        if (typeof lv.required_townhall === "number") req[level] = lv.required_townhall;
        let t = build ? lv.build_time : (lv.upgrade_time ?? lv.research_time);
        if (t === undefined) { const k = Object.keys(lv).find(k => /(upgrade|build|research).*time/i.test(k)); if (k) t = lv[k]; }
        if (typeof t === "number" && t > 0) m[build ? level : level + 1] = t;
      });
      if (Object.keys(m).length) durs[id] = m;
      if (max) REMOTE_MAX[id] = max;
      if (Object.keys(req).length) REMOTE_REQ[id] = req;
      REMOTE_VIL[id] = node.village || "home";
      // Town Hall: what each level unlocks ({ id: how many more }), for buildings not built yet.
      if (id === TOWN_HALL)
        for (const lv of lvls) for (const u of Array.isArray(lv.unlocks) ? lv.unlocks : []) {
          const L = Number(lv.level), uid = Number(u && u._id), q = Number(u && u.quantity) || 1;
          if (!L || !uid) continue;
          (REMOTE_UNLOCKS[L] = REMOTE_UNLOCKS[L] || {})[uid] = ((REMOTE_UNLOCKS[L] || {})[uid] || 0) + q;
        }
      const last = lvls[lvls.length - 1];
      if (node.superchargeable === true || (last && last.supercharge)) REMOTE_SC[id] = true;
    }
    // Super troops and seasonal troops are boosted or trained, never researched.
    if (node.super_troop || node.is_seasonal) REMOTE_NOUP[id] = true;
    // Crafting Station: which crafted defense each module belongs to (for its picture).
    if (Array.isArray(node.seasonal_defenses))
      for (const sd of node.seasonal_defenses)
        for (const mo of (sd && sd.modules) || []) if (mo && mo._id) REMOTE_PARENT[mo._id] = sd.name;
  }
  for (const [k, v] of Object.entries(node))
    if (v && typeof v === "object") collectNames(v, out, durs, depth + 1, depth === 0 ? k : sect);
}

// Total length of an upgrade (ms, at normal speed), for the progress bar.
// `factors` are the possible "time left after reductions" multipliers when it started
// (1 = full length, 0.5 = Hammer Jam, 0.4 = Hammer Jam + 20% Gold Pass…). Every
// combination is a candidate; the shortest one that still fits the work left wins.
// A small tolerance (1%, at least a minute) covers the game rounding timers.
function knownDuration(it, remaining, factors = [1]) {
  const m = REMOTE_DURS[it.id];
  if (!m || it.sc) return 0;
  if (typeof factors === "number") factors = [1, 1 - factors];
  const base = [m[it.to]].filter(x => x > 0).map(x => x * 1000);
  const cands = [...new Set(base.flatMap(d => factors.map(f => Math.round(d * f))))].filter(d => d > 0);
  const ok = cands.filter(d => d >= remaining - Math.max(60000, d * 0.01)).sort((a, b) => a - b);
  return ok[0] || 0;
}

// Is `d` the item's full (unreduced) length from the game data?
function isBaseLen(it, d) {
  const m = REMOTE_DURS[it.id];
  return !!m && [m[it.to]].some(x => x > 0 && Math.abs(x * 1000 - d) < 1000);
}

function itemName(it) {
  return NAMES[it.id] || REMOTE_NAMES[it.id] || CAT[it.cat].generic;
}
function itemLabel(it) {
  let s = `${itemName(it)} → Lv ${it.to}`;
  if (it.gear) s = `${itemName(it)} (Gear Up)`;
  if (it.sc) s = `${itemName(it)} (Supercharge)`;
  return s;
}

// ─────────────────────────────── Parsing ───────────────────────────────────

function classify(key) {
  const k = String(key).toLowerCase();
  const bb = /2$/.test(k);
  if (/^(units|troops|spells|siege|squads?)/.test(k)) return bb ? "starlab" : "lab";
  if (/^pets/.test(k)) return "pets";
  if (/^(buildings|traps|heroes|walls|guardians)/.test(k)) return bb ? "bb" : "builder";
  return bb ? "bb" : "other";
}
// Lists in the export that never hold running upgrades.
const NOT_UPGRADES = /^(helpers|equipment|decos|obstacles|skins|sceneries|house_parts|emotes|building_variants|boosts|achievements)/i;
// For a list this script doesn't know yet: decide by the item's id.
function catById(id, bb) {
  const g = Math.floor(id / 1e6);
  if (g === 4 || g === 26) return bb ? "starlab" : "lab";        // troops, Squads, siege machines, spells
  if (g === 73) return "pets";
  if (g === 1 || g === 12 || g === 28 || g === 102 || g === 107) return bb ? "bb" : "builder"; // buildings, traps, heroes, crafted modules, guardians
  return bb ? "bb" : "other";
}
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const truthy = (v) => v === true || v === 1 || v === "1" || v === "true";

// One running upgrade from an export row (or null).
function upgradeRow(row, key, cat, ts) {
  const id = num(row.data), lvl = num(row.lvl);
  const timer = num(row.timer ?? row.upgrade_timer);
  if (!id || timer <= 0) return null;
  if (REMOTE_NOUP[id]) return null; // super / seasonal troops: a boost, not research
  // "gear_up": 1 marks a building that HAS been geared up (permanent), and those
  // still get normal level upgrades from Home Village builders. So it isn't treated
  // as a gear-up in progress: the export has no reliable way to tell those apart.
  const geared = Object.keys(row).some(k => /gear/i.test(k) && row[k]);
  const gear = false;
  // Supercharge: only at the building's max level, and only for buildings that still
  // have one (Town Hall 19 removed them from Air Defense, X-Bow, Builder's Hut, …).
  const max = REMOTE_MAX[id];
  const sc = max ? !!REMOTE_SC[id] && lvl >= max
    : Object.keys(row).some(k => /supercharge/i.test(k) && row[k] !== undefined && row[k] !== null);
  // Upgrades done by the Goblin Builder / Researcher ("extra" worker).
  const goblin = truthy(row.extra) || Object.keys(row).some(k => /goblin/i.test(k) && row[k]);
  const ht = num(row.helper_timer ?? row.helperTimer);
  return {
    id, lvl, to: lvl + 1, src: key,
    cat, gear, geared, sc, goblin,
    raw: timer,                   // work left at normal speed (seconds)
    helperAssigned: truthy(row.recurrent_helper) || truthy(row.helper_recurrent) || truthy(row.recurrentHelper) || ht > 0,
    helperEnd: ht ? (ts + ht) * 1000 : null,
    end: (ts + timer) * 1000,
  };
}

// Returns null if the text is not a CoC village export.
function parseExport(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.trim();
  if (!t.startsWith("{") || t.indexOf('"tag"') < 0) return null;
  let j;
  try { j = JSON.parse(t); } catch (e) { return null; }
  if (!j || typeof j !== "object" || typeof j.tag !== "string") return null;

  let ts = Number(j.timestamp);
  if (!ts) ts = Math.floor(Date.now() / 1000);
  if (ts > 1e12) ts = Math.floor(ts / 1000); // tolerate milliseconds

  const items = [], levels = [];
  let huts = 0, th = null, bh = null, bob = false, clockLvl = 0;

  for (const [key, val] of Object.entries(j)) {
    if (!Array.isArray(val) || NOT_UPGRADES.test(key)) continue;
    const baseCat = classify(key), bbKey = /2$/.test(key);
    for (const row of val) {
      if (!row || typeof row !== "object") continue;
      const id = num(row.data);
      const lvl = num(row.lvl);
      if (key === "buildings") {
        if (id === BUILDERS_HUT) huts += row.timer ? 1 : (num(row.cnt) || 1);
        if (id === TOWN_HALL) th = Math.max(th || 0, lvl);
      }
      if (id === BOB_HUT && lvl > 0) bob = true; // B.O.B's Hut: one more Home Village builder
      if (key === "buildings2" && id === BUILDER_HALL) bh = Math.max(bh || 0, lvl);
      if (key === "buildings2" && id === CLOCK_TOWER && lvl > 0) clockLvl = Math.max(clockLvl, lvl);
      const cat = baseCat === "other" ? catById(id, bbKey) : baseCat;
      const it = upgradeRow(row, key, cat, ts);
      if (it) items.push(it);
      // Every Home Village level, upgrading or not (for "progress to max").
      const pc = bbKey || !id ? null : /^heroes/i.test(key) ? "heroes" : progCatOf(cat);
      const up = num(row.timer ?? row.upgrade_timer) > 0 ? 1 : 0;
      if (pc) levels.push({ id, lvl, cnt: up ? 1 : (num(row.cnt) || 1), c: pc, up });
      // Crafting Station: each crafted defense's modules are upgraded on their own.
      for (const ty of Array.isArray(row.types) ? row.types : [])
        for (const mo of (ty && Array.isArray(ty.modules) ? ty.modules : [])) {
          const mi = mo && typeof mo === "object" ? upgradeRow(mo, "crafting", bbKey ? "bb" : "builder", ts) : null;
          if (mi) { mi.crafted = num(ty.data) || null; items.push(mi); }
        }
    }
  }
  items.sort((a, b) => a.end - b.end);
  const seen = {};
  for (const it of items) { const k = `${it.id}_${it.to}`; seen[k] = (seen[k] || 0) + 1; it.uid = `${k}_${seen[k]}`; }

  // Boosts running at export time: { builder_boost: secondsLeft, lab_consumable: ... }.
  // The same object carries the Gold Pass perks as percentages (builder_time_reduction…).
  const boosts = [], unknownBoosts = {};
  const jb = j.boosts && typeof j.boosts === "object" ? j.boosts : {};
  const PERK_KEYS = /(time|cost)_reduction$/i;
  for (const [k, v] of Object.entries(jb)) {
    const secs = Number(v);
    if (!(secs > 0) || PERK_KEYS.test(k) || /cooldown/i.test(k) || /clock/i.test(k)) continue;
    const kind = boostKind(k);
    if (kind) boosts.push({ kind, from: ts * 1000, to: (ts + secs) * 1000, key: k });
    else unknownBoosts[k] = secs;
  }
  // Builder Base Clock Tower: boost running (seconds left) and recharge (seconds until ready).
  const ctBoost = num(jb.clocktower_boost ?? jb.clockTowerBoost), ctCd = num(jb.clocktower_cooldown ?? jb.clockTowerCooldown);
  const clock = clockLvl || ctBoost || ctCd
    ? { lvl: clockLvl || null, boostEnd: ctBoost ? (ts + ctBoost) * 1000 : null, readyAt: ctCd ? (ts + ctCd) * 1000 : null } : null;
  // Gold Pass Builder Boost / Research Boost of this account, if the export has them.
  const pct = (keys) => { for (const k of keys) if (jb[k] !== undefined && jb[k] !== null && Number.isFinite(Number(jb[k]))) return Math.max(0, Math.min(50, Number(jb[k]))) / 100; return null; };
  const pb = pct(["builder_time_reduction", "building_time_reduction"]), pl = pct(["lab_time_reduction", "research_time_reduction"]);
  const pass = pb === null && pl === null ? null : { builder: pb || 0, lab: pl || 0 };
  // Helpers: Builder's Apprentice, Lab Assistant, Alchemist, Prospector (level + shared cooldown)
  const helpers = {};
  const sharedCd = num(jb.helper_cooldown ?? jb.helperCooldown);
  for (const h of Array.isArray(j.helpers) ? j.helpers : []) {
    const name = HELPER_IDS[num(h && h.data)];
    if (!name) continue;
    const cd = num(h.helper_cooldown ?? h.helperCooldown ?? h.cooldown) || sharedCd;
    helpers[name] = { lvl: num(h.lvl) || 1, cooldownEnd: cd ? (ts + cd) * 1000 : null };
  }
  return { tag: j.tag.toUpperCase(), ts: ts * 1000, th, bh, huts, bob, items, boosts, unknownBoosts, helpers, pass, clock, levels };
}

// ──────────────────────────── Progress to max ──────────────────────────────
// For the account's Town Hall level: how much upgrade time is done / left, per part
// (like Clash Ninja). Weighted by upgrade time; walls (no time) don't count.
// Buildings not built yet (new at this Town Hall) and troops / pets / heroes not
// unlocked yet count as level 0. Times at normal speed (no boosts or reductions).
const PROG_CATS = [
  { k: "builder", name: "Builder", emoji: "🔨" }, { k: "heroes", name: "Heroes", emoji: "👑" },
  { k: "lab", name: "Lab", emoji: "⚗️" }, { k: "pets", name: "Pets", emoji: "🐾" },
];
function progCatOf(cat) { return cat === "builder" ? "builder" : cat === "lab" ? "lab" : cat === "pets" ? "pets" : null; }
function progCatById(id) {
  const g = Math.floor(id / 1e6);
  return g === 28 ? "heroes" : g === 73 ? "pets" : g === 4 || g === 26 ? "lab" : g === 1 || g === 12 || g === 107 ? "builder" : null;
}
// Highest level this Town Hall allows.
function maxAtTH(id, th) {
  const r = REMOTE_REQ[id];
  if (!r) return 0;
  let m = 0;
  for (const [L, t] of Object.entries(r)) if (t <= th && +L > m) m = +L;
  return m;
}
// Time (s) to go from level `from` up to level `to`.
function timeBetween(id, from, to) {
  const m = REMOTE_DURS[id] || {};
  let s = 0;
  for (let L = from + 1; L <= to; L++) s += m[L] || 0;
  return s;
}
function maxProgress(acc, now = Date.now()) {
  const th = acc.th;
  if (!th || !Array.isArray(acc.levels) || !Object.keys(REMOTE_REQ).length) return null;
  const out = {};
  for (const c of PROG_CATS) out[c.k] = { total: 0, left: 0 };
  const have = new Set();
  const running = (acc.items || []).slice();
  for (const row of acc.levels) {
    have.add(row.id);
    const max = maxAtTH(row.id, th), o = out[row.c];
    if (!max || !o) continue;
    const lvl = Math.min(row.lvl, max);
    const total = timeBetween(row.id, 0, max);
    if (!total) continue;
    let left = timeBetween(row.id, lvl, max);
    if (row.up && lvl < max) {
      // Upgrading now: the work still left on this level, then the rest.
      const k = running.findIndex(i => i.id === row.id && i.lvl === row.lvl && !i.sc);
      const it = k >= 0 ? running.splice(k, 1)[0] : null;
      const cur = timeBetween(row.id, lvl, lvl + 1);
      const wl = it ? (it.end > now ? Math.min(cur, workLeftAt(acc, it, now) / 1000) : 0) : cur;
      left = left - cur + wl;
    }
    o.total += total * row.cnt; o.left += left * row.cnt;
  }
  // Not built / unlocked yet at this Town Hall.
  const missing = {};
  for (let L = 1; L <= th; L++) for (const [id, q] of Object.entries(REMOTE_UNLOCKS[L] || {})) missing[id] = (missing[id] || 0) + q;
  for (const [id, sect] of Object.entries(REMOTE_SECT)) {
    if (!/^(troops|spells|heroes|pets|guardians)$/.test(sect) || REMOTE_NOUP[id] || REMOTE_VIL[id] !== "home") continue;
    const r = REMOTE_REQ[id];
    if (r && r[1] !== undefined && r[1] <= th && !missing[id]) missing[id] = 1;
  }
  for (const [ids, q] of Object.entries(missing)) {
    const id = +ids;
    if (have.has(id) || REMOTE_VIL[id] !== "home") continue;
    const c = progCatById(id), max = maxAtTH(id, th);
    if (!c || !max) continue;
    const t = timeBetween(id, 0, max) * q;
    out[c].total += t; out[c].left += t;
  }
  for (const c of PROG_CATS) { const o = out[c.k]; o.pct = o.total ? Math.max(0, Math.min(1, 1 - o.left / o.total)) : null; }
  return out;
}
function fmtDays(sec) {
  if (sec <= 0) return "0";
  const d = sec / 86400;
  return d >= 10 ? `${Math.round(d)}d` : d >= 1 ? `${Math.round(d * 10) / 10}d` : `${Math.max(1, Math.round(sec / 3600))}h`;
}
function pctText(p) { return p === null || p === undefined ? "–" : p >= 1 ? "100%" : `${Math.min(99, Math.floor(p * 100))}%`; }
function bar10(p) { const n = Math.round((p || 0) * 10); return "▰".repeat(n) + "▱".repeat(10 - n); }
async function maxProgressFlow() {
  try { await refreshRemoteNames(); } catch (e) { }
  const db = loadDB(), now = Date.now();
  const t = new UITable(); t.showSeparators = true;
  const accs = orderedAccounts(db);
  for (const a of accs) {
    const h = new UITableRow(); h.isHeader = true; h.height = 54; h.backgroundColor = new Color("#1d2740");
    const hc = h.addText(`${a.name}  ·  TH${a.th || "?"}`, "Progress to max for this Town Hall");
    hc.titleColor = new Color("#e3b341"); hc.subtitleColor = Color.white(); hc.titleFont = Font.boldSystemFont(16); hc.subtitleFont = Font.systemFont(12);
    t.addRow(h);
    const p = maxProgress(a, now);
    if (!p) {
      const r = new UITableRow(); r.height = 60;
      r.addText("Not available yet", Array.isArray(a.levels) ? "Game data still loading: open this again in a minute." : "Sync this account once (open and close Clash).");
      t.addRow(r); continue;
    }
    const n = builderCount(a);
    for (const c of PROG_CATS) {
      const o = p[c.k];
      const r = new UITableRow(); r.height = 58;
      let sub = `${bar10(o.pct)}  ${o.left > 0 ? fmtDays(o.left) + " left" : "maxed ✓"}`;
      if (c.k === "builder" && n && o.left > 0) sub += ` · ≈${fmtDays((o.left + p.heroes.left) / n)} with ${n} builders (heroes incl.)`;
      const cell = r.addText(`${c.emoji}  ${c.name}  ${pctText(o.pct)}`, sub);
      cell.titleFont = Font.semiboldSystemFont(15); cell.subtitleFont = Font.systemFont(12);
      t.addRow(r);
    }
  }
  const f = new UITableRow(); f.height = 50;
  f.addText("", "By upgrade time at normal speed (no boosts, no Gold Pass / event reductions). Walls not counted.").subtitleFont = Font.systemFont(11);
  t.addRow(f);
  await t.present(false);
}
// One line for the overview widget: "🔨 78%  👑 70%  ⚗️ 85%  🐾 90%"
function progressLine(parent, acc, now) {
  const p = maxProgress(acc, now);
  if (!p) return false;
  const r = parent.addStack(); r.layoutHorizontally(); r.centerAlignContent();
  PROG_CATS.forEach((c, i) => {
    if (i) r.addSpacer(10);
    const o = p[c.k];
    shade(t2(r, `${c.emoji} `, 9, TH.dim));
    shade(t2(r, pctText(o.pct), 9.5, o.pct >= 1 ? TH.free : TH.sub, "heavy"));
  });
  r.addSpacer();
  return true;
}

// ─────────────────────────────── Accounts ──────────────────────────────────

function defaultName(acc) {
  const short = acc.tag.replace("#", "").slice(-4);
  return acc.th ? `TH${acc.th} · ${short}` : acc.tag;
}

function builderCount(acc) { return acc.builders || (acc.huts ? Math.min(7, acc.huts + (acc.bob ? 1 : 0)) : null); }

function activeAt(acc, cat, t) {
  return (acc.items || []).filter(i => i.cat === cat && i.end > t);
}

function orderedAccounts(db) {
  return Object.values(db.accounts).sort((a, b) =>
    (b.th || 0) - (a.th || 0) || (a.name || "").localeCompare(b.name || ""));
}

function findAccount(db, query) {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  if (/^[1-9]$/.test(q)) return orderedAccounts(db)[Number(q) - 1] || null;
  const accs = orderedAccounts(db);
  const exact = accs.find(a =>
    (a.name || "").toLowerCase() === q || a.tag.toLowerCase() === q ||
    a.tag.toLowerCase() === "#" + q.replace("#", ""));
  if (exact) return exact;
  // Forgiving match: ignore spaces, dots and symbols, and allow part of the name
  // ("rrl8" finds "TH18 · RRL8", "demon claw" finds "GIE DemonClaw").
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const nq = norm(q);
  if (nq.length < 2) return null;
  return accs.find(a => norm(a.name) === nq || norm(a.gameName) === nq)
    || accs.find(a => norm(a.name).includes(nq) || norm(a.gameName).includes(nq)) || null;
}

// Imports export text. Returns {status: "new"|"updated"|"duplicate"|"invalid", acc}
async function importExport(text) {
  const p = parseExport(text);
  if (!p) return { status: "invalid" };
  const db = loadDB();
  const existing = db.accounts[p.tag];
  if (existing && existing.lastExport && existing.lastExport >= p.ts) {
    // Same export synced again right after an update of this script: pick up what's new.
    if (existing.lastExport === p.ts && ((p.clock && !existing.clock) || (p.levels.length && !existing.levels))) {
      if (!existing.clock) existing.clock = p.clock;
      if (!existing.levels) existing.levels = p.levels;
      saveDB(db);
    }
    return { status: "duplicate", acc: existing };
  }
  const acc = existing || { tag: p.tag, name: null, builders: null };
  // The export says which Gold Pass boosts this account has: save them from its time on.
  if (p.pass) try {
    const st = loadSettings(), r = reductions(st);
    if (setAccountPass(r, p.tag, p.pass.builder, p.pass.lab, Date.now(), p.ts, "export")) { st.reduce = r; delete st.cut; saveSettings(st); }
  } catch (e) { }
  // Work out each upgrade's full length for the progress bars. Once a length has been
  // matched to game data it's kept; otherwise: game data (with any time reduction you
  // set), else the time left at first sight.
  const prev = (existing && existing.items || []).map(x => ({ ...x }));
  for (const it of p.items) {
    const remaining = it.raw ? it.raw * 1000 : it.end - p.ts; // work left at normal speed
    const m = prev.find(q => !q._used && q.id === it.id && q.to === it.to && q.cat === it.cat);
    if (m) m._used = true;
    // First time this upgrade was seen: work left then, and when. Used to tell an
    // upgrade started during an event from one that was already running before it.
    it.seenAt = (m && m.seenAt) || (m ? existing.lastExport : p.ts) || p.ts;
    // (An older version kept a length counted from first sight in `dur`; a length that
    // came from the game data says nothing about when the upgrade was first seen.)
    it.seen = (m && m.seen) || (m && !m.durKnown && m.dur && !isBaseLen(it, m.dur) ? m.dur : 0) || remaining;
    if (m && m.durKnown && m.dur) { it.dur = Math.max(m.dur, remaining); it.durKnown = true; continue; }
    const floor = Math.max(remaining, it.seen);
    const kd = knownDuration(it, floor, cutFactors(it, timeCuts(it.seenAt, p.tag)));
    it.dur = Math.max(kd, floor);
    if (kd) it.durKnown = true;
  }
  Object.assign(acc, {
    th: p.th ?? acc.th, bh: p.bh ?? acc.bh, huts: p.huts || acc.huts, bob: p.bob, clock: p.clock, levels: p.levels,
    items: p.items, lastExport: p.ts, updated: Date.now(),
    exportTs: p.ts, boostsExport: p.boosts, unknownBoosts: p.unknownBoosts, helpers: p.helpers,
    manualBoosts: [], // the export is the truth from its timestamp on
  });
  recomputeEnds(acc);
  if (!acc.name) acc.name = defaultName(acc);
  db.accounts[p.tag] = acc;
  saveDB(db);
  await rescheduleAll(db);
  return { status: existing ? "updated" : "new", acc };
}

// ───────────────────────────── Notifications ───────────────────────────────

function freeBuildersText(acc, t) {
  const total = builderCount(acc);
  const busy = activeAt(acc, "builder", t).length;
  if (!total) return busy ? `${busy} builder${busy > 1 ? "s" : ""} still busy` : "All builders free";
  const free = Math.max(0, total - busy);
  return `${free} of ${total} builders free`;
}

// Build the list of notifications for all accounts (grouped per account per minute).
function plannedNotifications(db, now) {
  const out = [];
  for (const acc of Object.values(db.accounts)) {
    const groups = new Map();
    for (const it of acc.items || []) {
      if (it.end <= now + 30 * 1000) continue;
      const key = Math.round(it.end / 60000);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    }
    for (const [key, its] of groups) {
      const end = Math.max(...its.map(i => i.end));
      let title, body;
      if (its.length === 1) {
        const it = its[0];
        title = `${acc.name}: ${itemName(it)} done ${CAT[it.cat].emoji}`;
        body = `${itemLabel(it)} finished. ${CAT[it.cat].free}.`;
      } else {
        title = `${acc.name}: ${its.length} upgrades done`;
        body = its.map(i => `${CAT[i.cat].emoji} ${itemLabel(i)}`).join("\n");
      }
      if (its.some(i => i.cat === "builder")) body += `\n🔨 ${freeBuildersText(acc, end + 1)}`;
      out.push({ id: `${NOTIF_PREFIX}${acc.tag}|${key}`, thread: `coc-${acc.tag}`, title, body, end });
    }
    out.push(...helperNotifications(acc, now));
    out.push(...sleepNotifications(acc, now));
  }
  out.sort((a, b) => a.end - b.end);
  return out.slice(0, MAX_NOTIFS);
}

// ── Sleep alerts ──
// Upgrades that finish while you sleep leave a builder / the lab idle until you wake up.
// 30 minutes before bedtime: one alert per account with what finishes during the night.
const SLEEP_LEAD = 30 * 60000, SLEEP_MIN_IDLE = 30 * 60000;
function sleepCfg() {
  let s = {};
  try { s = loadSettings().sleep || {}; } catch (e) { }
  const ok = (v) => typeof v === "string" && /^([01]?\d|2[0-3]):[0-5]\d$/.test(v);
  return { on: s.on !== false, from: ok(s.from) ? s.from : "01:00", to: ok(s.to) ? s.to : "08:00" };
}
const hm = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
const pad2 = (n) => String(n).padStart(2, "0");
function fmtHM(ts) { const d = new Date(ts); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
// The nights around `now`: [{ start, end }] in local time.
function sleepNights(now, cfg = sleepCfg()) {
  const len = ((hm(cfg.to) - hm(cfg.from) + 1440) % 1440 || 1440) * 60000;
  const out = [];
  for (let k = -1; k <= 2; k++) {
    const d = new Date(now); d.setDate(d.getDate() + k);
    d.setHours(Math.floor(hm(cfg.from) / 60), hm(cfg.from) % 60, 0, 0);
    out.push({ start: d.getTime(), end: d.getTime() + len });
  }
  return out;
}
// Upgrades of this account that finish during that night (with ≥30 min idle until wake-up).
function finishesAsleep(acc, night) {
  return (acc.items || []).filter(i => i.end > night.start && i.end <= night.end - SLEEP_MIN_IDLE).sort((a, b) => a.end - b.end);
}
// Will this upgrade finish while you sleep, within the next day? (😴 on the widget)
function sleepsThrough(it, now) {
  const cfg = sleepCfg();
  if (!cfg.on || it.end <= now || it.end - now > 864e5) return false;
  return sleepNights(now, cfg).some(n => it.end > n.start && it.end <= n.end - SLEEP_MIN_IDLE);
}
function sleepNotifications(acc, now) {
  const cfg = sleepCfg();
  if (!cfg.on) return [];
  const out = [];
  for (const night of sleepNights(now, cfg)) {
    const at = night.start - SLEEP_LEAD;
    if (at <= now + 30 * 1000) continue;
    const its = finishesAsleep(acc, night);
    if (!its.length) continue;
    const idle = (i) => fmtShort(night.end - i.end);
    out.push({ id: `${NOTIF_PREFIX}${acc.tag}|sleep|${Math.round(night.start / 60000)}`, thread: `coc-${acc.tag}`,
      title: `${acc.name}: ${its.length === 1 ? itemName(its[0]) + " finishes" : its.length + " upgrades finish"} while you sleep 😴`,
      body: its.map(i => `${CAT[i.cat].emoji} ${itemLabel(i)} · ${fmtHM(i.end)} (idle ~${idle(i)} until ${cfg.to})`).join("\n"),
      end: at });
  }
  return out;
}
function sleepLabel() { const c = sleepCfg(); return c.on ? `${c.from}–${c.to}` : "off"; }
async function sleepFlow() {
  while (true) {
    const c = sleepCfg();
    const a = new Alert();
    a.title = "Sleep alerts";
    a.message = `30 minutes before bedtime: which upgrades finish while you sleep (the builder or lab then waits until you wake up), so you can start something longer or boost first. Upgrades that finish then also get 😴 on the widget.\n\nNow: ${c.on ? `${c.from}–${c.to}` : "off"}`;
    a.addAction(c.on ? "Turn off" : "Turn on");
    a.addAction("Change hours…");
    a.addCancelAction("Done");
    const i = await a.presentSheet();
    if (i < 0) return;
    const st = loadSettings(); st.sleep = { ...c };
    if (i === 0) st.sleep.on = !c.on;
    else {
      const t = new Alert(); t.title = "Sleep hours"; t.message = "24-hour time, e.g. 01:00 and 08:00";
      t.addTextField("Bedtime", c.from); t.addTextField("Wake up", c.to);
      t.addAction("Save"); t.addCancelAction("Cancel");
      if ((await t.present()) < 0) continue;
      const fix = (v) => { const m = /^(\d{1,2})(?:[:.](\d{2}))?$/.exec(String(v || "").trim()); if (!m || +m[1] > 23 || +(m[2] || 0) > 59) return null; return `${pad2(+m[1])}:${m[2] || "00"}`; };
      const f = fix(t.textFieldValue(0)), w = fix(t.textFieldValue(1));
      if (!f || !w || f === w) { await info("Not saved", "Use times like 01:00 and 08:00."); continue; }
      st.sleep.from = f; st.sleep.to = w; st.sleep.on = true;
    }
    saveSettings(st);
    await rescheduleAll(loadDB());
  }
}

// ── Gold Pass this season? ──
// The export doesn't say whether an account has the Gold Pass. So: your choice for this
// season in the menu (Time reduction → Gold Pass), else "yes" when this season's
// Builder or Research Boost is above 0% (read from the export, or set in the menu).
// Only used to show the Prospector, who works for Gold Pass holders only.
function goldPassChoice(tag, now) {
  let g = null;
  try { g = (loadSettings().goldPass || {})[tag]; } catch (e) { }
  return g && (!g.until || now < g.until) ? !!g.has : null;
}
function hasGoldPass(acc, now) {
  const c = goldPassChoice(acc.tag, now);
  if (c !== null) return c;
  try { const st = passStepAt(passSteps(reductions(), acc.tag), now); return !!st && (st.builder > 0 || st.lab > 0); } catch (e) { return false; }
}

// ── Helper ready alerts ──
// Each helper in the export has its own cooldown: the time until it can work again.
// One alert per account when it ends (helpers ready in the same minute share one).
const HELPERS = {
  apprentice: { name: "Builder's Apprentice", emoji: "🔨", what: "assign him to a builder upgrade", cat: "builder" },
  assistant:  { name: "Lab Assistant",        emoji: "⚗️", what: "assign him to a research", cat: "lab" },
  alchemist:  { name: "Alchemist",            emoji: "🧪", what: "she can convert resources again" },
  prospector: { name: "Prospector",           emoji: "⛏️", what: "he can work again" },
};
const HELPER_ORDER = ["apprentice", "assistant", "alchemist", "prospector"];
const ALERT_ORDER = HELPER_ORDER.concat(["clock"]);
const ALERT_NAME = (k) => k === "clock" ? "⏰ Clock Tower" : `${HELPERS[k].emoji} ${HELPERS[k].name}`;
function helperAlertsOn() {
  let s = {};
  try { s = loadSettings().helperAlerts || {}; } catch (e) { }
  const out = {};
  for (const k of ALERT_ORDER) out[k] = s[k] !== false; // on unless turned off
  return out;
}
// The upgrade a helper is set to keep working on every day (if it's still running at `t`).
function recurrentUpgrade(acc, key, t) {
  const cat = HELPERS[key] && HELPERS[key].cat;
  if (!cat) return null;
  return (acc.items || []).find(i => boostCat(i) === cat && i.helperAssigned && i.end > t) || null;
}
function helperNotifications(acc, now) {
  const on = helperAlertsOn(), ready = [];
  for (const [key, h] of Object.entries(acc.helpers || {})) {
    if (!HELPERS[key] || !on[key] || !h || !h.cooldownEnd || h.cooldownEnd <= now + 30 * 1000) continue;
    if (key === "prospector" && !hasGoldPass(acc, now)) continue; // Gold Pass holders only
    // Set to keep helping the same upgrade every day, and it's still running then:
    // he goes back to work by himself, so there's nothing for you to do.
    if (recurrentUpgrade(acc, key, h.cooldownEnd)) continue;
    ready.push({ key, end: h.cooldownEnd });
  }
  // Helpers ready within a minute of each other share one alert.
  ready.sort((a, b) => a.end - b.end);
  const groups = new Map();
  let first = null;
  for (const r of ready) {
    if (first === null || r.end - first > 60000) { first = r.end; groups.set(Math.round(first / 60000), []); }
    groups.get(Math.round(first / 60000)).push(r.key);
  }
  const out = [];
  for (const [m, keys] of groups) {
    keys.sort((a, b) => HELPER_ORDER.indexOf(a) - HELPER_ORDER.indexOf(b));
    const end = Math.max(...keys.map(k => acc.helpers[k].cooldownEnd));
    const names = keys.map(k => HELPERS[k].name);
    const title = `${acc.name}: ${names.length > 1 ? names.slice(0, -1).join(", ") + " & " + names[names.length - 1] : names[0]} ready ${keys.map(k => HELPERS[k].emoji).join("")}`;
    const body = keys.map(k => `${HELPERS[k].emoji} ${HELPERS[k].name}: ${HELPERS[k].what}.`).join("\n");
    out.push({ id: `${NOTIF_PREFIX}${acc.tag}|helper|${m}`, thread: `coc-${acc.tag}`, title, body, end });
  }
  // Builder Base Clock Tower ready to boost again.
  const c = acc.clock;
  if (on.clock && c && c.readyAt && c.readyAt > now + 30 * 1000)
    out.push({ id: `${NOTIF_PREFIX}${acc.tag}|clock|${Math.round(c.readyAt / 60000)}`, thread: `coc-${acc.tag}`,
      title: `${acc.name}: Clock Tower ready ⏰`, body: "Ready to boost your Builder Base.", end: c.readyAt });
  return out;
}

async function helperAlertsFlow() {
  while (true) {
    const on = helperAlertsOn();
    const a = new Alert();
    a.title = "Ready alerts";
    a.message = "A notification when a helper can work again, or the Builder Base Clock Tower can boost again (from your last sync).\n" +
      "Not sent when the Apprentice / Lab Assistant is set to keep helping the same upgrade and it's still running: he goes back to work by himself.";
    for (const k of ALERT_ORDER) a.addAction(`${on[k] ? "✅" : "⬜️"} ${ALERT_NAME(k)}`);
    a.addAction("All on");
    a.addAction("All off");
    a.addCancelAction("Done");
    const i = await a.presentSheet();
    if (i < 0) break;
    const st = loadSettings();
    st.helperAlerts = { ...on };
    if (i < ALERT_ORDER.length) st.helperAlerts[ALERT_ORDER[i]] = !on[ALERT_ORDER[i]];
    else for (const k of ALERT_ORDER) st.helperAlerts[k] = i === ALERT_ORDER.length;
    saveSettings(st);
  }
  await rescheduleAll(loadDB());
}
function helperAlertsLabel() {
  const on = helperAlertsOn(), n = ALERT_ORDER.filter(k => on[k]).length;
  return n === ALERT_ORDER.length ? "all on" : n ? ALERT_ORDER.filter(k => on[k]).map(k => k === "clock" ? "⏰" : HELPERS[k].emoji).join(" ") : "off";
}

async function rescheduleAll(db) {
  const pending = await Notification.allPending();
  const ours = pending.map(n => n.identifier).filter(id => id && id.startsWith(NOTIF_PREFIX));
  if (ours.length) await Notification.removePending(ours);
  for (const p of plannedNotifications(db, Date.now())) {
    const n = new Notification();
    n.identifier = p.id;
    n.threadIdentifier = p.thread;
    n.title = p.title;
    n.body = p.body;
    n.sound = "complete";
    n.openURL = CLASH_URL;
    n.setTriggerDate(new Date(p.end));
    await n.schedule();
  }
}

async function notifyNow(title, body) {
  const n = new Notification();
  n.title = title; n.body = body; n.threadIdentifier = "coc-tracker-status";
  await n.schedule();
}

// ─────────────────────────────── Formatting ────────────────────────────────

function fmtLeft(ms) {
  if (ms <= 0) return "done";
  const m = Math.ceil(ms / 60000);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d) return h ? `${d}d ${h}h` : `${d}d`;
  if (h) return mm ? `${h}h ${mm}m` : `${h}h`;
  return `${mm}m`;
}

function fmtClock(ts) {
  const df = new DateFormatter();
  const d = new Date(ts), now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  df.dateFormat = sameDay ? "h:mm a" : "EEE h:mm a";
  return df.string(d);
}

function fmtAgo(ts) {
  const ms = Date.now() - ts;
  if (ms < 60000) return "just now";
  return fmtLeft(ms) + " ago";
}

function summaryLine(acc, now) {
  const total = builderCount(acc);
  const b = activeAt(acc, "builder", now);
  const lab = activeAt(acc, "lab", now);
  let s = total ? `🔨 ${Math.max(0, total - b.length)}/${total} free` : `🔨 ${b.length} busy`;
  if (b.length) s += ` · next ${fmtLeft(b[0].end - now)}`;
  s += lab.length ? ` · ⚗️ ${fmtLeft(lab[0].end - now)}` : " · ⚗️ free";
  return s;
}

// ──────────────────────────────── Themes ───────────────────────────────────
// Pick the default in the menu (🎨 Theme). Any widget can override it by adding
// the theme to its Parameter, e.g.  1, clash   or   Main | mono

const C_ = (hex, a) => new Color(hex, a === undefined ? 1 : a);
const THEMES = {
  elixir: {
    name: "Elixir Night", style: "bar", shadow: true,
    bg: [C_("#2d1650"), C_("#120a22")], text: C_("#ffffff"), sub: C_("#e6dcff"), dim: C_("#9a8fb3"),
    accent: C_("#ffc94d"), free: C_("#56d364"), idle: C_("#ff9f43"),
    pillBg: C_("#ffffff", 0.12), pillText: C_("#e9dcff"), track: C_("#ffffff", 0.07),
    sec: { builder: C_("#ffc94d"), lab: C_("#ff7ad9"), pets: C_("#4fe3c1"), bb: C_("#8fb8ff") },
    fill: { builder: [C_("#b86a00"), C_("#f0a020")], lab: [C_("#a03cff"), C_("#ff5fd2")],
            pets: [C_("#12b39a"), C_("#5bf0d0")], bb: [C_("#2f6bff"), C_("#7fb2ff")] },
  },
  clash: {
    name: "Clash Classic", style: "bar", shadow: true, gloss: true, tiles: true, dot: true,
    bg: [C_("#56361f"), C_("#3b2415")], text: C_("#ffffff"), sub: C_("#fff4dc"), dim: C_("#c99a62"),
    accent: C_("#f6c544"), free: C_("#8fe060"), idle: C_("#ffb347"),
    pillBg: C_("#f2c03a"), pillText: C_("#4a2a0c"), track: C_("#2a190e"),
    sec: { builder: C_("#f6c544"), lab: C_("#f6c544"), pets: C_("#f6c544"), bb: C_("#f6c544") },
    fill: { default: [C_("#a6ec6a"), C_("#5fb52f")] },
  },
  royal: {
    name: "Royal Gold", style: "line", lineH: 4,
    bg: [C_("#2e3138"), C_("#1b1d22")], text: C_("#f3ead7"), sub: C_("#9c8c6a"), dim: C_("#8c8370"),
    accent: C_("#d4af37"), free: C_("#7ee787"), idle: C_("#f0883e"),
    pillBg: C_("#d4af37", 0.15), pillText: C_("#d4af37"), track: C_("#ffffff", 0.08),
    sec: { builder: C_("#d4af37"), lab: C_("#d4af37"), pets: C_("#d4af37"), bb: C_("#d4af37") },
    fill: { default: [C_("#a57b25"), C_("#f2d16b")] },
  },
  glass: {
    name: "Liquid Glass", style: "bar",
    bg: [C_("#56565c"), C_("#2c2c30")], text: C_("#ffffff"), sub: C_("#ffffff", 0.8), dim: C_("#ffffff", 0.55),
    accent: C_("#ffd76a"), free: C_("#7ee787"), idle: C_("#ffb27a"),
    pillBg: C_("#ffffff", 0.16), pillText: C_("#ffffff"), track: C_("#ffffff", 0.08),
    sec: { builder: C_("#ffffff", 0.75), lab: C_("#ffffff", 0.75), pets: C_("#ffffff", 0.75), bb: C_("#ffffff", 0.75) },
    fill: { default: [C_("#ffffff", 0.16), C_("#ffffff", 0.34)] },
  },
  mono: {
    name: "Minimal Mono", style: "line", lineH: 2, soonGreen: true,
    bg: [C_("#000000"), C_("#000000")], text: C_("#ffffff"), sub: C_("#6e6e73"), dim: C_("#5a5a5e"),
    accent: C_("#8e8e93"), free: C_("#34d058"), idle: C_("#ff9f0a"),
    pillBg: C_("#1c1c1e"), pillText: C_("#8e8e93"), track: C_("#1f1f22"),
    sec: { builder: C_("#8e8e93"), lab: C_("#8e8e93"), pets: C_("#8e8e93"), bb: C_("#8e8e93") },
    fill: { default: [C_("#ffffff"), C_("#ffffff")] },
  },
  graphite: {
    name: "Graphite", style: "bar",
    bg: [C_("#1c1f26"), C_("#121418")], text: C_("#ffffff"), sub: C_("#c9d1d9"), dim: C_("#8b93a1"),
    accent: C_("#e3b341"), free: C_("#56d364"), idle: C_("#f0883e"),
    pillBg: C_("#2f343e"), pillText: C_("#c9d1d9"), track: C_("#2a2e37"),
    sec: { builder: C_("#e3b341"), lab: C_("#e3b341"), pets: C_("#e3b341"), bb: C_("#e3b341") },
    fill: { default: [C_("#2ea043"), C_("#2ea043")] },
  },
};
const THEME_ORDER = ["elixir", "clash", "royal", "glass", "mono", "graphite"];
let TH = THEMES.elixir; // active theme while drawing

function findTheme(word) {
  const w = String(word || "").trim().toLowerCase().replace(/\s+/g, "");
  if (!w) return null;
  for (const k of THEME_ORDER) {
    const n = THEMES[k].name.toLowerCase().replace(/\s+/g, "");
    if (w === k || w === n || n.startsWith(w) && w.length >= 4) return k;
  }
  return null;
}

// Widget Parameter → { account query, theme key }
function parseParam(param) {
  let acct = null, theme = null, prog = null;
  for (const part of String(param || "").split(/[,|]/)) {
    const p = part.trim();
    if (!p) continue;
    const t = findTheme(p), g = findProg(p);
    if (t) theme = t; else if (g) prog = g; else acct = p;
  }
  return { acct, theme, prog };
}

// ─────────────────────────────── Settings ──────────────────────────────────
let SETTINGS_PATH;
function loadSettings() {
  try { if (fm.fileExists(SETTINGS_PATH)) return JSON.parse(fm.readString(SETTINGS_PATH)); } catch (e) { }
  return {};
}
function saveSettings(s) { fm.writeString(SETTINGS_PATH, JSON.stringify(s)); }

// ──────────────────────────── Time reductions ──────────────────────────────
// Upgrades you START during an event or with a Gold Pass boost are shorter, but the
// export doesn't say so and the game data only has the full length. Only the progress
// bars use this: timers and alerts always come from the export itself.
//
// How they combine (player reports for Hammer Jam, and the Summer Jam guide's formula):
// the reductions MULTIPLY. Hammer Jam 50% + Gold Pass 20% → 0.5 × 0.8 = 0.4 of the
// time, i.e. 60% shorter (not 70%). Summer Jam 40% + 20% → 0.6 × 0.8 = 0.48 → 52%.
// Supercharges and the Builder Base are never reduced. The Gold Pass Builder Boost
// counts for builders (incl. heroes), the Research Boost for the lab; pets only get
// the event's reduction.
//
// Gold Pass boosts start each season at 0% and go up (10% → 15% → 20%) as you claim
// them. Each time you set a new value, it's saved with the time you set it ("steps"),
// so an upgrade gets the boost that applied when it started. Every step ends by itself
// when the season ends (1st of next month, 08:00 UTC): back to 0% with no action.
const IS_WIDGET = () => typeof config !== "undefined" && config.runsInWidget;
const CUT_GRACE = 864e5;   // an upgrade started on the last day may be exported a day later
const PASS_LOOKBACK = 30 * 864e5; // an upgrade first synced now may have started up to this long ago

// End of the Gold Pass season that `t` falls in: the 1st of next month, 08:00 UTC.
function seasonEnd(t) {
  const d = new Date(t);
  const thisMonth = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 8);
  return t < thisMonth ? thisMonth : Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 8);
}

// settings.reduce = { event: {name, builder, lab, pets, until},          ← every account
//                     passes: { "#TAG": { steps: [{ at, builder, lab, until }] } } }  ← per account
// The Gold Pass belongs to one account, so each account has its own steps. "*" is a
// Gold Pass saved by an older version for all accounts; it's replaced as soon as you
// set the Gold Pass for an account.
function reductions(st) {
  st = st || loadSettings();
  let r = st.reduce;
  if (!r && st.cut) // older version of this script: one combined setting
    r = { event: { name: "Custom", builder: st.cut.builder || 0, lab: st.cut.lab || 0, pets: st.cut.pets || 0, until: st.cut.until || null } };
  r = Object.assign({}, r || {});
  r.passes = Object.assign({}, r.passes || {});
  if (r.pass) { // older versions: one Gold Pass for every account
    const steps = Array.isArray(r.pass.steps) ? r.pass.steps
      : [{ at: 0, builder: r.pass.builder || 0, lab: r.pass.lab || 0, until: r.pass.until || null }];
    if (!r.passes["*"] && !Object.keys(r.passes).length) r.passes["*"] = { steps };
    delete r.pass;
  }
  return r;
}
// The Gold Pass steps of one account (its own, else an old all-accounts setting).
function passSteps(r, tag) {
  const p = r.passes || {};
  return ((tag && p[tag]) || p["*"] || {}).steps || [];
}
function partOn(part, at) { return !!part && (!part.until || at <= part.until + CUT_GRACE); }

// When a Gold Pass step stops applying: the next step, or its season's end.
function stepEnd(steps, i) {
  const s = steps[i], next = steps[i + 1];
  const end = s.until ? s.until : Infinity;
  return next ? Math.min(next.at, end) : end;
}
// The Gold Pass step in force at `t` (null = 0%: none set yet, or the season ended).
function passStepAt(steps, t, grace = 0) {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].at > t) continue;
    return t < stepEnd(steps, i) + grace ? steps[i] : null;
  }
  return null;
}

// What was on at time `at`: the event, the Gold Pass step in force, and every Gold Pass
// value an upgrade first synced at `at` could have started with (`passAll`).
function timeCuts(at, tag) {
  let r = {};
  try { r = reductions(); } catch (e) { }
  const steps = passSteps(r, tag);
  const passAll = steps.filter((s, i) => s.at <= at && stepEnd(steps, i) + CUT_GRACE > at - PASS_LOOKBACK);
  return { event: partOn(r.event, at) ? r.event : null, pass: passStepAt(steps, at, CUT_GRACE), passAll };
}

function boostCatOf(it) { return it.sc ? null : boostCat(it); }
// Every length multiplier the upgrade may have started with: full, event or not,
// times each Gold Pass value that applied around then (all multiplied).
function cutFactors(it, cuts) {
  const c = boostCatOf(it);
  if (!c || !cuts) return [1];
  const es = [0], ps = [0];
  if (cuts.event) es.push(Number(cuts.event[c]) || 0);
  if (c !== "pets") for (const s of cuts.passAll || (cuts.pass ? [cuts.pass] : [])) ps.push(Number(s[c]) || 0);
  const r6 = (x) => Math.round(x * 1e6) / 1e6;
  const out = new Set();
  for (const e of es) for (const p of ps) out.add(r6((1 - e) * (1 - p)));
  return [...out].filter(x => x > 0).sort((a, b) => b - a);
}
// Total reduction (0–1) for a new upgrade in category `cat` with what's on now.
function combinedCut(cat, cuts) {
  const e = cuts.event ? Number(cuts.event[cat]) || 0 : 0;
  const p = cuts.pass && cat !== "pets" ? Number(cuts.pass[cat]) || 0 : 0;
  return 1 - (1 - e) * (1 - p);
}

const pc = (x) => `${Math.round((x || 0) * 100)}%`;
function fmtDay(ts) { const df = new DateFormatter(); df.dateFormat = "d MMM"; return df.string(new Date(ts)); }
function nowCuts(now, tag) {
  // For showing what's on right now: no grace, so the Gold Pass reads 0% from the reset on.
  const r = reductions(), steps = passSteps(r, tag);
  return { event: r.event && (!r.event.until || now <= r.event.until) ? r.event : null, pass: passStepAt(steps, now) };
}
const passOn = (s) => !!s && !!(s.builder || s.lab);
// "Hammer Jam 50% + Gold Pass Main 🔨20% ⚗️20%"
function cutLabel() {
  const now = Date.now(), c = nowCuts(now), parts = [];
  if (c.event) {
    const e = c.event;
    parts.push(e.builder === e.lab && e.lab === e.pets ? `${e.name} ${pc(e.builder)}` : `${e.name} 🔨${pc(e.builder)} ⚗️${pc(e.lab)} 🐾${pc(e.pets)}`);
  }
  let accs = [];
  try { accs = orderedAccounts(loadDB()); } catch (e) { }
  const r = reductions();
  if (r.passes["*"]) { const s = passStepAt(r.passes["*"].steps, now); if (passOn(s)) parts.push(`Gold Pass (all) 🔨${pc(s.builder)} ⚗️${pc(s.lab)}`); }
  for (const a of accs) {
    if (!r.passes[a.tag]) continue;
    const s = passStepAt(r.passes[a.tag].steps, now);
    if (passOn(s)) parts.push(`Gold Pass ${a.name} 🔨${pc(s.builder)} ⚗️${pc(s.lab)}`);
  }
  return parts.length ? parts.join(" + ") : "off";
}

// Pick the bar length again for every running upgrade. Uses the work left when the
// upgrade was first synced (and what was on at that time), so one that was already
// running before an event keeps its full length.
function repickDurations() {
  const db = loadDB(), now = Date.now();
  let n = 0, total = 0;
  for (const acc of Object.values(db.accounts))
    for (const it of acc.items || []) {
      if (it.end <= now) continue;
      total++;
      const left = workLeftAt(acc, it, now);
      const floor = Math.max(left, it.seen || 0);
      const kd = knownDuration(it, floor, cutFactors(it, timeCuts(it.seenAt || now, acc.tag)));
      if (kd) { it.dur = Math.max(kd, floor); it.durKnown = true; n++; }
    }
  saveDB(db);
  return { n, total };
}

// Save a new Gold Pass value from `at` on (default: now; earlier if you claimed it
// before you got round to setting it). Only saved if it changes something. Old steps
// are kept for a while, so upgrades started earlier still get the boost they had.
function setPassStep(r, builder, lab, now, at = now, src = "menu") {
  at = Math.min(at, now);
  const steps = ((r.pass && r.pass.steps) || []).filter((s, i, all) => stepEnd(all, i) > now - 2 * PASS_LOOKBACK);
  const cur = passStepAt(steps, at), later = steps.some(s => s.at > at);
  if (!later && cur && cur.builder === builder && cur.lab === lab) return false;
  if (!later && !cur && !builder && !lab) return false;
  // The new value is the latest truth: anything set for the same moment or after it goes.
  while (steps.length && steps[steps.length - 1].at >= at) steps.pop();
  steps.push({ at, builder, lab, until: seasonEnd(at), src });
  r.pass = { steps };
  return true;
}

// Save a Gold Pass value for ONE account. Setting it for an account also retires an old
// all-accounts setting (you only have the Gold Pass where you set it).
function setAccountPass(r, tag, builder, lab, now, at = now, src = "menu") {
  r.passes = r.passes || {};
  const hadAll = !!r.passes["*"];
  const holder = { pass: { steps: passSteps(r, tag).slice() } };
  const changed = setPassStep(holder, builder, lab, now, at, src);
  if (!changed && !hadAll) return false;
  r.passes[tag] = holder.pass;
  delete r.passes["*"];
  return true;
}

function ymd(ts) { if (!ts) return ""; const df = new DateFormatter(); df.dateFormat = "yyyy-MM-dd"; return df.string(new Date(ts)); }
// "2026-11-16" → that day 23:59 local; "" → null (no end); anything else → undefined
function parseYMD(s) {
  s = String(s || "").trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59).getTime() : undefined;
}
const pctIn = (v) => Math.max(0, Math.min(90, parseFloat(String(v || "").replace(",", ".")) || 0)) / 100;
const pctOut = (x) => (x ? String(Math.round(x * 100)) : "");

async function askEvent(cur, preset) {
  const a = new Alert();
  a.title = preset ? "Hammer Jam" : "Event time reduction";
  a.message = preset
    ? "50% shorter builder, lab and pet upgrades.\nEnd date as YYYY-MM-DD (check the event timer in the game; Hammer Jam 2026 ends 16 Nov)."
    : "e.g. Summer Jam 2026: 40% up to TH16, 25% at TH17–18 — check the timer of a new upgrade in the game.\nEnd date as YYYY-MM-DD (empty = until you remove it).";
  const same = cur && (!preset || cur.name === "Hammer Jam");
  if (!preset) {
    a.addTextField("Name", (cur && cur.name !== "Hammer Jam" && cur.name) || "Summer Jam");
    a.addTextField("Builders %", same ? pctOut(cur.builder) : "");
    a.addTextField("Lab %", same ? pctOut(cur.lab) : "");
    a.addTextField("Pets %", same ? pctOut(cur.pets) : "");
  }
  a.addTextField("Ends YYYY-MM-DD", same ? ymd(cur.until) : "");
  a.addAction("Save"); a.addCancelAction("Cancel");
  if ((await a.present()) < 0) return undefined;
  const k = preset ? 0 : 4;
  const until = parseYMD(a.textFieldValue(k));
  if (until === undefined) { await info("Date not understood", "Write it like 2026-11-16."); return undefined; }
  if (preset) return { name: "Hammer Jam", builder: 0.5, lab: 0.5, pets: 0.5, until };
  return { name: String(a.textFieldValue(0)).trim() || "Event", builder: pctIn(a.textFieldValue(1)),
    lab: pctIn(a.textFieldValue(2)), pets: pctIn(a.textFieldValue(3)), until };
}

// Returns true if a new Gold Pass value was saved.
async function askPass(r) {
  const acc = await pickAccount(loadDB(), "Gold Pass on which account?");
  if (!acc) return false;
  const now = Date.now(), cur = passStepAt(passSteps(r, acc.tag), now);
  // First: boosts, or whether this account has the Gold Pass this season (Prospector).
  const choice = goldPassChoice(acc.tag, now), has = hasGoldPass(acc, now);
  const g = new Alert();
  g.title = `Gold Pass · ${acc.name}`;
  g.message = `Has the Gold Pass this season: ${has ? "yes" : "no"}` +
    (choice === null ? " (auto: from the Builder / Research Boost being above 0%)" : " (set by you, until the season ends)") +
    `\nBoosts now: 🔨${pc(cur && cur.builder)} ⚗️${pc(cur && cur.lab)}\n\nThe Prospector is shown only for Gold Pass holders.`;
  g.addAction("🎟️ Boosts claimed (10/15/20%)…");
  g.addAction(`${choice === true ? "✅" : "⬜️"} Has the Gold Pass this season`);
  g.addAction(`${choice === false ? "✅" : "⬜️"} No Gold Pass this season`);
  g.addAction(`${choice === null ? "✅" : "⬜️"} Auto (from the boosts)`);
  g.addCancelAction("Cancel");
  const gi = await g.presentSheet();
  if (gi < 0) return false;
  if (gi > 0) {
    const st = loadSettings();
    st.goldPass = st.goldPass || {};
    if (gi === 3) delete st.goldPass[acc.tag];
    else st.goldPass[acc.tag] = { has: gi === 1, until: seasonEnd(now) };
    saveSettings(st);
    await rescheduleAll(loadDB());
    return false;
  }
  const a = new Alert();
  a.title = `Gold Pass boosts · ${acc.name}`;
  a.message = "Usually set by itself: each Data Export says which boosts this account has. " +
    "Set it here only if it's missing.\n\nSet what you've claimed so far (0, 10, 15 or 20). Change it each time you claim a new boost: " +
    "upgrades started before keep the old value. Claimed it earlier? Put that day in the last field.\n\nGoes back to 0% by itself when the season ends (" + fmtDay(seasonEnd(now)) + ").\n" +
    "With an event they multiply: Hammer Jam 50% + 20% = 60% shorter.";
  a.addTextField("Builder Boost % (0/10/15/20)", cur ? String(Math.round(cur.builder * 100)) : "0");
  a.addTextField("Research Boost % (0/10/15/20)", cur ? String(Math.round(cur.lab * 100)) : "0");
  a.addTextField("Claimed on YYYY-MM-DD (empty = now)", "");
  a.addAction("Save"); a.addCancelAction("Cancel");
  if ((await a.present()) < 0) return false;
  const day = String(a.textFieldValue(2) || "").trim();
  let at = now;
  if (day) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(day);
    if (!m) { await info("Date not understood", "Write it like 2026-11-03, or leave it empty for now."); return false; }
    at = new Date(+m[1], +m[2] - 1, +m[3], 0, 0).getTime(); // from the start of that day
  }
  return setAccountPass(r, acc.tag, pctIn(a.textFieldValue(0)), pctIn(a.textFieldValue(1)), now, at);
}

async function offerRepick() {
  const a = new Alert();
  a.title = "Fix upgrades already running?";
  a.message = "Recalculates the bars of upgrades that are running now. Upgrades that were already running before the reduction keep their full length.";
  a.addAction("Recalculate"); a.addCancelAction("Not now");
  if ((await a.present()) < 0) return;
  const r = repickDurations();
  await info("Progress bars", r.n
    ? `${r.n} of ${r.total} running upgrades recalculated.`
    : "No upgrade lengths were found in the game data, so the bars keep counting from the time left when each upgrade was first synced.");
}

async function timeCutFlow() {
  while (true) {
    const st = loadSettings();
    if ((st.cut && !st.reduce) || (st.reduce && st.reduce.pass)) {
      st.reduce = reductions(st); delete st.cut; saveSettings(st);
    }
    const r = reductions(st), now = Date.now(), on = nowCuts(now);
    const accs = orderedAccounts(loadDB());
    const lines = [];
    lines.push(r.event ? `Event (all accounts): ${r.event.name} 🔨${pc(r.event.builder)} ⚗️${pc(r.event.lab)} 🐾${pc(r.event.pets)}` +
      (r.event.until ? ` · until ${fmtDay(r.event.until)}` : "") + (on.event ? "" : " (ended)") : "Event: none");
    lines.push("");
    if (r.passes["*"]) {
      const s = passStepAt(r.passes["*"].steps, now);
      lines.push(`Gold Pass (all accounts, old setting): 🔨${pc(s && s.builder)} ⚗️${pc(s && s.lab)} — set it per account to replace it`);
    }
    for (const acc of accs) {
      const c = nowCuts(now, acc.tag), s = c.pass;
      lines.push(`${acc.name}: ` + (passOn(s) ? `Gold Pass 🔨${pc(s.builder)} ⚗️${pc(s.lab)}${s.src === "export" ? " (from export)" : ""} (0% on ${fmtDay(s.until)})` : "no Gold Pass") +
        (c.event || passOn(s) ? ` → new upgrades 🔨${pc(combinedCut("builder", c))} ⚗️${pc(combinedCut("lab", c))} 🐾${pc(combinedCut("pets", c))} shorter` : ""));
    }
    lines.push("\nEvent and Gold Pass multiply: 50% + 20% = 60%, not 70%. Only the progress bars use this.");
    const a = new Alert();
    a.title = "Time reduction";
    a.message = lines.join("\n");
    const acts = [
      ["🔨 Hammer Jam (50%)", async () => { const e = await askEvent(r.event, true); if (e) { r.event = e; return true; } }],
      ["☀️ Summer Jam / other event…", async () => { const e = await askEvent(r.event, false); if (e) { r.event = e; return true; } }],
      ["🎟️ Gold Pass boost (per account)…", async () => askPass(r)],
      ["🔁 Recalculate running upgrades", async () => { await offerRepick(); }],
    ];
    for (const [l] of acts) a.addAction(l);
    const dest = [];
    if (r.event) { a.addDestructiveAction(`Remove ${r.event.name}`); dest.push(() => { delete r.event; return true; }); }
    a.addCancelAction("Done");
    const i = await a.presentSheet();
    if (i < 0) return;
    const changed = i < acts.length ? await acts[i][1]() : dest[i - acts.length]();
    if (changed) {
      const st2 = loadSettings(); st2.reduce = r; delete st2.cut; saveSettings(st2);
      if (i < 3) await offerRepick();
    }
  }
}

// ───────────────────────────────── Icons ───────────────────────────────────
// Unit/building pictures from ClashKing's free asset library (assets.clashk.ing).
// Downloaded during sync or from the menu, shrunk, and cached on the phone.
const ICON_BASE = "https://assets.clashk.ing/";
let ICON_DIR, ICON_INDEX_PATH, ICON_INDEX = {};

function initIcons() {
  ICON_DIR = fm.joinPath(DIR, "icons");
  if (!fm.fileExists(ICON_DIR)) fm.createDirectory(ICON_DIR, true);
  ICON_INDEX_PATH = fm.joinPath(DIR, "icons.json");
  try { if (fm.fileExists(ICON_INDEX_PATH)) ICON_INDEX = JSON.parse(fm.readString(ICON_INDEX_PATH)); } catch (e) { ICON_INDEX = {}; }
}
function saveIconIndex() { fm.writeString(ICON_INDEX_PATH, JSON.stringify(ICON_INDEX)); }

// Same as ClashKing's folder names: "Builder's Hut" → "builder's_hut", "P.E.K.K.A" → "pekka".
function slug(name) {
  return name.toLowerCase().replace(/ /g, "_").replace(/\./g, "").replace(/\?/g, "").replace(/’/g, "");
}
const ICON_V = 4; // bump to retry earlier misses
const UNIT_GROUPS = [4, 26, 28, 73]; // troops, spells, heroes, pets: one picture per item
function isBuildingLike(it) { return !UNIT_GROUPS.includes(Math.floor(it.id / 1e6)); }
function iconKey(it) { return isBuildingLike(it) ? `${it.id}_${it.to}` : String(it.id); }

function iconCandidates(it) {
  const name = NAMES[it.id] || REMOTE_NAMES[it.id] || (CAT[it.cat] && itemName(it) !== CAT[it.cat].generic ? itemName(it) : null);
  const out = [];
  const known = REMOTE_ICONS[it.id];
  if (known) out.push(/^https?:/.test(known) ? known : ICON_BASE + known.replace(/^\//, ""));
  if (!name) return out;
  const s = slug(name), s2 = slug(name.replace(/ Spell$/i, "")), sNoApos = s.replace(/'/g, "");
  // Folder named after the item's category in ClashKing's own data (e.g. "guardians").
  const sectPaths = [];
  const sect = REMOTE_SECT[it.id];
  if (sect) {
    for (const f of [...new Set([sect, sect.replace(/_/g, "-"), sect.toLowerCase()])]) {
      sectPaths.push(`${ICON_BASE}${f}/${s}/icon.webp`, `${ICON_BASE}${f}/${s}.webp`,
        `${ICON_BASE}${f}/${s}/level_${it.to}.webp`, `${ICON_BASE}${f}/home-village/${s}/icon.webp`,
        `${ICON_BASE}${f}/home-village/${s}/level_${it.to}.webp`, `${ICON_BASE}${f}/home-village/${s}.webp`);
    }
  }
  const group = Math.floor(it.id / 1e6);
  const bb = it.cat === "bb" || it.cat === "starlab";
  if (group === 102 || it.crafted) {
    // Crafted defense module ("Hot Candle Damage"): picture of its defense.
    const parent = REMOTE_PARENT[it.id] || NAMES[it.crafted] || REMOTE_NAMES[it.crafted]
      || Object.entries(NAMES).filter(([i, n]) => Math.floor(i / 1e6) === 103 && name.startsWith(n)).map(([, n]) => n)[0];
    if (parent) { const ps = slug(parent);
      for (const l of [4, 3, 2, 1]) out.push(`${ICON_BASE}buildings/seasonal-defense/${ps}/level_${l}.webp`); }
  } else if (group === 1) {
    const v = bb ? "builder-base" : "home-village";
    for (const f of [...new Set([s, sNoApos])])
      out.push(`${ICON_BASE}buildings/${v}/${f}/level_${it.to}.webp`, `${ICON_BASE}buildings/${v}/${f}/level_${it.lvl || 1}.webp`,
               `${ICON_BASE}buildings/${v}/${f}/icon.webp`);
  } else if (group === 4) {
    out.push(`${ICON_BASE}troops/${s}/icon.webp`, `${ICON_BASE}troops/${s}.webp`);
  } else if (group === 26) {
    out.push(`${ICON_BASE}spells/${s}.webp`, `${ICON_BASE}spells/${s2}.webp`, `${ICON_BASE}spells/${s}/icon.webp`);
  } else if (group === 28) {
    out.push(`${ICON_BASE}heroes/${s}/icon.webp`, `${ICON_BASE}heroes/${s}.webp`, `${ICON_BASE}heroes/${s}/icon.png`);
  } else if (group === 73) {
    out.push(`${ICON_BASE}pets/${s}/icon.webp`, `${ICON_BASE}pets/${s}.webp`);
  } else if (group === 12) {
    const v = bb ? "builder-base" : "home-village";
    out.push(`${ICON_BASE}traps/${v}/${s}/level_${it.to}.webp`, `${ICON_BASE}traps/${v}/${s}/level_${it.lvl || 1}.webp`,
             `${ICON_BASE}traps/${v}/${s}/icon.webp`, `${ICON_BASE}traps/${s}.webp`);
  } else {
    // Newer item types (e.g. Guardians like the Logger): category folder first, then likely folders.
    const v = bb ? "builder-base" : "home-village";
    out.push(...sectPaths);
    out.push(`${ICON_BASE}guardians/${s}/icon.webp`, `${ICON_BASE}guardians/${s}/level_${it.to}.webp`,
             `${ICON_BASE}guardians/${s}.webp`, `${ICON_BASE}buildings/${v}/${s}/level_${it.to}.webp`,
             `${ICON_BASE}buildings/${v}/${s}/icon.webp`, `${ICON_BASE}heroes/${s}/icon.webp`,
             `${ICON_BASE}troops/${s}/icon.webp`);
  }
  out.push(...sectPaths);
  return [...new Set(out)];
}

function iconPath(it) { return fm.joinPath(ICON_DIR, iconKey(it) + ".png"); }
function getIcon(it) {
  try { const p = iconPath(it); if (fm.fileExists(p)) return Image.fromFile(p); } catch (e) { }
  return null;
}

// Download missing icons (max `limit` network tries per run). Returns a report.
async function ensureIcons(items, limit = 30, force = false) {
  const report = [];
  let tries = 0;
  for (const it of items) {
    const key = iconKey(it);
    const entry = ICON_INDEX[key];
    if (!force && fm.fileExists(iconPath(it))) { report.push({ it, ok: true, url: entry && entry.url, cached: true }); continue; }
    if (!force && entry && entry.fail && entry.v === ICON_V && Date.now() - entry.fail < 3 * 864e5) { report.push({ it, ok: false, tried: entry.tried || [] }); continue; }
    const tried = [];
    let ok = false;
    for (const url of iconCandidates(it)) {
      if (tries >= limit) break;
      tries++;
      tried.push(url.replace(ICON_BASE, ""));
      try {
        const req = new Request(url);
        req.timeoutInterval = 5;
        const data = await req.load();
        const code = req.response && req.response.statusCode;
        if (code && code !== 200) continue;
        const img = Image.fromData(data);
        if (!img || !img.size || img.size.width < 4) continue;
        const dc = new DrawContext();
        dc.size = new Size(72, 72); dc.opaque = false; dc.respectScreenScale = false;
        const s = Math.min(72 / img.size.width, 72 / img.size.height);
        const w = img.size.width * s, h = img.size.height * s;
        dc.drawImageInRect(img, new Rect((72 - w) / 2, (72 - h) / 2, w, h));
        fm.writeImage(iconPath(it), dc.getImage());
        ICON_INDEX[key] = { url };
        ok = true;
        report.push({ it, ok: true, url });
        break;
      } catch (e) { /* next candidate */ }
    }
    if (!ok) { ICON_INDEX[key] = { fail: Date.now(), v: ICON_V, tried }; report.push({ it, ok: false, tried }); }
  }
  saveIconIndex();
  return report;
}

// ──────────────────────────────── Widget ───────────────────────────────────
const SECTIONS = [
  { key: "builder", title: "BUILDERS", cats: ["builder"] },
  { key: "lab",     title: "LAB",      cats: ["lab"] },
  { key: "pets",    title: "PETS",     cats: ["pets"] },
  { key: "bb",      title: "BUILDER BASE", cats: ["bb", "starlab", "other"] },
];
const SEC_OF = { builder: "builder", lab: "lab", pets: "pets", bb: "bb", starlab: "bb", other: "bb" };

function shade(t) {
  if (!TH.shadow) return;
  t.shadowColor = new Color("#000000", 0.6);
  t.shadowRadius = 1.5;
  t.shadowOffset = new Point(0, 1);
}

function t2(stack, s, size, color, weight) {
  const t = stack.addText(String(s));
  t.font = weight === "bold" ? Font.boldSystemFont(size)
    : weight === "semibold" ? Font.semiboldSystemFont(size)
    : weight === "heavy" ? Font.heavySystemFont(size)
    : Font.mediumSystemFont(size);
  t.textColor = color || TH.text;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.6;
  return t;
}

// Share of the upgrade's work that's done. Counts the work left (at normal speed),
// not the clock time left, so potions / snacks / helpers don't overfill the bar.
function progressOf(it, now, acc = CUR_ACC) {
  if (it.end <= now) return 1;
  if (!it.dur) return 0;
  return Math.max(0, Math.min(1, 1 - workLeftAt(acc, it, now) / it.dur));
}

function fillColors(secKey) { return TH.fill[secKey] || TH.fill.default; }

function setBarFill(stack, p, colors) {
  const g = new LinearGradient();
  g.startPoint = new Point(0, 0.5);
  g.endPoint = new Point(1, 0.5);
  const q = Math.max(0, Math.min(1, p));
  // colour runs a→b across the filled part, then a hard edge into the track
  g.colors = [colors[0], colors[1], TH.track, TH.track];
  g.locations = [0, Math.max(q, 0.0001), Math.min(1, q + 0.001), 1];
  stack.backgroundGradient = g;
}

// Glossy game-style bar (Clash Classic), drawn as an image.
function glossBar(w, h, p, colors) {
  const dc = new DrawContext();
  dc.size = new Size(w, h); dc.opaque = false; dc.respectScreenScale = true;
  const r = h * 0.34;
  let path = new Path(); path.addRoundedRect(new Rect(0, 0, w, h), r, r);
  dc.addPath(path); dc.setFillColor(TH.track); dc.fillPath();
  if (p > 0) {
    const fw = Math.max(h * 0.9, w * p);
    path = new Path(); path.addRoundedRect(new Rect(0, 0, fw, h), r, r);
    dc.addPath(path); dc.setFillColor(colors[1]); dc.fillPath();
    path = new Path(); path.addRoundedRect(new Rect(1, 1, fw - 2, h * 0.5), r * 0.8, r * 0.8);
    dc.addPath(path); dc.setFillColor(colors[0]); dc.fillPath();
    path = new Path(); path.addRoundedRect(new Rect(r * 0.6, 2, Math.max(0, fw - r * 1.2), 2), 1, 1);
    dc.addPath(path); dc.setFillColor(new Color("#ffffff", 0.35)); dc.fillPath();
    path = new Path(); path.addRect(new Rect(1, h - 2, fw - 2, 1));
    dc.addPath(path); dc.setFillColor(new Color("#000000", 0.15)); dc.fillPath();
  }
  return dc.getImage();
}

function soon(it, now) { return TH.soonGreen && it.end > now && it.end - now < 36e5; }

// Live countdown: "1:16:19", or "1d 0:33:44" past a day.
function addCountdown(stack, end, now, size, color) {
  const left = end - now;
  const days = Math.floor(left / 864e5);
  const target = end - days * 864e5;
  const r = target - now;
  let next = target;
  if (days > 0) {
    let pre = `${days}d `;
    if (r < 6e5) pre += "0:0";
    else if (r < 36e5) { pre += "0:"; next = target - 6e5; }
    else next = target - 36e5;
    shade(t2(stack, pre, size, color || TH.text, "bold"));
  }
  const d = stack.addDate(new Date(target));
  d.applyTimerStyle();
  d.font = Font.boldMonospacedSystemFont(size);
  d.textColor = color || TH.text;
  d.leftAlignText();
  d.lineLimit = 1;
  d.minimumScaleFactor = 0.6;
  shade(d);
  return next;
}

function addIcon(parent, it, size) {
  const img = getIcon(it);
  if (img) {
    const im = parent.addImage(img);
    im.imageSize = new Size(size, size);
    im.cornerRadius = size * 0.22;
    parent.addSpacer(5);
  } else if (TH.tiles) {
    const tile = parent.addStack();
    tile.size = new Size(size, size); tile.cornerRadius = size * 0.28;
    tile.backgroundColor = C_("#d9a456"); tile.borderColor = C_("#3a2414"); tile.borderWidth = 1.5;
    tile.centerAlignContent();
    t2(tile, itemName(it)[0] || "?", size * 0.5, C_("#3a2414"), "heavy");
    parent.addSpacer(5);
  }
}

function addTimerCol(r, it, now, h, fs, timerW) {
  const tc = r.addStack();
  tc.layoutHorizontally();
  tc.centerAlignContent();
  tc.size = new Size(timerW, h);
  if (TH.dot && it.end > now) {
    const dot = tc.addStack(); dot.size = new Size(8, 8); dot.cornerRadius = 4;
    dot.backgroundColor = TH.accent; tc.addSpacer(4);
  }
  if (it.end <= now) { shade(t2(tc, "✓ Done", fs, TH.free, "heavy")); tc.addSpacer(); return null; }
  return addCountdown(tc, it.end, now, fs, soon(it, now) ? TH.free : TH.text);
}

function nameAndLevel(r, it, fs) {
  if (it.goblin) { const g = r.addStack(); g.setPadding(0, 4, 0, 4); g.cornerRadius = 4; g.borderWidth = 1; g.borderColor = TH.free;
    t2(g, "GOBLIN", 7, TH.free, "heavy"); r.addSpacer(4); }
  let name = itemName(it);
  if (it.gear) name += " (Gear Up)";
  if (it.sc) name += " ⚡";
  shade(t2(r, name, fs, TH.text, "bold"));
  r.addSpacer(4);
  shade(t2(r, `→ ${it.to}`, fs - 2, TH.sub, "semibold"));
  if (sleepsThrough(it, Date.now())) { r.addSpacer(3); t2(r, "😴", fs - 3, TH.sub); }
  r.addSpacer();
}

// One upgrade, "bar" style: everything inside a progress bar.
function barRow(parent, it, now, h, fs, timerW, rowW) {
  const r = parent.addStack();
  r.layoutHorizontally();
  r.centerAlignContent();
  r.size = new Size(0, h);
  r.cornerRadius = Math.round(h * 0.32);
  r.setPadding(0, 5, 0, 4);
  r.url = rowURL(it);
  const p = progressOf(it, now), colors = fillColors(SEC_OF[it.cat]);
  if (TH.gloss) r.backgroundImage = glossBar(rowW, h, p, colors);
  else setBarFill(r, p, colors);
  r.addSpacer(3);
  addIcon(r, it, h - 6);
  nameAndLevel(r, it, fs);
  return addTimerCol(r, it, now, h, fs, timerW);
}

// One upgrade, "line" style: text row with a slim bar underneath.
function lineRow(parent, it, now, h, fs, timerW) {
  const v = parent.addStack();
  v.layoutVertically();
  v.url = rowURL(it);
  const r = v.addStack();
  r.layoutHorizontally();
  r.centerAlignContent();
  const textH = h - TH.lineH - 3;
  r.size = new Size(0, textH);
  addIcon(r, it, Math.min(textH, 16));
  nameAndLevel(r, it, fs);
  const rd = addTimerCol(r, it, now, textH, fs, timerW);
  v.addSpacer(2);
  const line = v.addStack();
  line.size = new Size(0, TH.lineH);
  line.cornerRadius = TH.lineH / 2;
  line.addSpacer();
  const colors = soon(it, now) || it.end <= now && TH.soonGreen ? [TH.free, TH.free] : fillColors(SEC_OF[it.cat]);
  setBarFill(line, progressOf(it, now), colors);
  return rd;
}

let CUR_ACC = null; // account being drawn (rows link to its detail pop-up)
function rowURL(it) { return CUR_ACC ? detailURL(CUR_ACC, it) : CLASH_URL; }

function sectionHeader(parent, title, secKey, right, rightColor, fs, extras) {
  const h = parent.addStack();
  h.layoutHorizontally();
  h.centerAlignContent();
  shade(t2(h, title, fs, TH.sec[secKey] || TH.accent, "heavy"));
  h.addSpacer(6);
  if (extras) extras(h);
  h.addSpacer();
  if (right) shade(t2(h, right, fs - 1, rightColor || TH.dim, "semibold"));
}

function syncPill(parent, acc, fs) {
  const s = parent.addStack();
  s.layoutHorizontally();
  s.centerAlignContent();
  s.backgroundColor = TH.pillBg;
  s.cornerRadius = 9;
  s.setPadding(3, 8, 3, 8);
  s.url = URLScheme.forRunningScript() + "?action=sync";
  t2(s, `⟳ ${acc ? fmtAgoShort(acc.lastExport) : "Sync"}`, fs, TH.pillText, "bold");
}

function fmtAgoShort(ts) {
  if (!ts) return "never";
  const ms = Date.now() - ts;
  if (ms < 60000) return "now";
  return fmtLeft(ms).split(" ")[0] + " ago";
}

// iPad widgets are much smaller than the iPad's screen, so they can't be sized from the
// screen width like on iPhone. Sizes (points) by the iPad's short side.
function padWidgetSize(family) {
  const sc = Device.screenSize();
  const short = Math.min(sc.width, sc.height);
  const S = short >= 1000 ? 170 : short >= 820 ? 155 : short >= 800 ? 146 : 141;
  const M = Math.round(S * 2.2);
  if (family === "small") return { w: S, h: S };
  if (family === "medium") return { w: M, h: S };
  if (family === "extraLarge") return { w: Math.round(M * 2.1), h: M };
  return { w: M, h: M };
}

function widgetSize(family) {
  if (typeof Device.isPad === "function" && Device.isPad()) return padWidgetSize(family);
  const w = Device.screenSize().width;
  const W = Math.round(w * 0.86);
  if (family === "small") return { w: Math.round(w * 0.39), h: Math.round(w * 0.39) };
  if (family === "medium") return { w: W, h: Math.round(w * 0.39) };
  return { w: W, h: Math.round(w * 0.89) };
}

function builderStatusText(acc, now) {
  const busy = activeAt(acc, "builder", now).length;
  const total = builderCount(acc);
  if (!total) return { s: `${busy} busy`, c: TH.dim };
  if (busy > total) { const g = busy - total; return { s: `${total}/${total} busy + ${g > 1 ? g + " Goblins" : "Goblin"}`, c: TH.free }; }
  const free = total - busy;
  return free ? { s: `${free} free · ${busy}/${total} busy`, c: TH.free } : { s: `${busy}/${total} busy`, c: TH.dim };
}

// Full view of one account: every running upgrade, grouped like the game.
// Row layout for one account: how tall rows can be and how many fit.
// opts.dense: compact bars rows (used when the chosen style can't fit every upgrade).
// opts.emptyBB: show the Builder Base header even with no upgrades (for the Clock Tower).
function planRows(acc, family, reserve, now, opts = {}) {
  const { w: W, h: Hfull } = widgetSize(family);
  const H = Hfull - 24 - 13 - reserve;
  const rowW = W - 24;
  const inSec = (s) => (acc.items || []).filter(i => s.cats.includes(i.cat)).sort((a, b) => a.end - b.end);
  const secs = SECTIONS.map(s => ({ ...s, items: inSec(s) }))
    .filter(s => s.items.length || s.key === "lab" || s.key === "builder" || (s.key === "bb" && opts.emptyBB));

  const allRows = secs.reduce((n, s) => n + s.items.length, 0);
  const dense = !!opts.dense;
  const lineLike = !dense && (PROG === "blocks" || (PROG === "bars" && TH.style === "line"));
  const headerH = 22, secH = 15, gap = lineLike || (!dense && PROG === "heat") ? 4 : 3;
  const [minH, maxH] = dense ? [16, 28] : lineLike ? [20, 30] : PROG === "heat" ? [20, 28] : PROG === "rings" ? [18, 30] : [16, 28];
  const room = H - headerH - 4 - secs.length * (secH + gap);
  const layout = (rows, floor) => {
    let h = Math.floor((room - rows * gap) / Math.max(1, rows));
    h = Math.max(floor, Math.min(maxH, h));
    return { rowH: h, maxRows: Math.max(1, Math.floor(room / (h + gap))) };
  };
  // Too many upgrades for the widget (e.g. Hammer Jam with Goblins): first put the
  // Builder Base upgrades side by side in ONE row, then make the rows a little slimmer.
  const bbSec = secs.find(s => s.key === "bb" && s.items.length > 1);
  let compactBB = false, totalRows = allRows, extra = 0;
  let L = layout(totalRows, minH);
  if (totalRows > L.maxRows && bbSec) {
    compactBB = true; extra = 1; // the shared Builder Base row
    totalRows = allRows - bbSec.items.length;
    L = layout(totalRows + extra, minH);
  }
  if (totalRows + extra > L.maxRows) L = layout(totalRows + extra, minH - 3);
  const rowH = L.rowH, maxRows = Math.max(1, L.maxRows - extra);
  return { W, H, rowW, secs, lineLike, headerH, gap, compactBB, totalRows, rowH, maxRows, dense };
}
const LIST_STYLES = ["bars", "rings", "blocks", "heat"];
// Plan for a list style: its own rows if every upgrade fits, else compact bars rows
// (theme colours kept) so nothing ends up under "+N more". Back to the style when it fits.
function planFor(acc, family, reserve, now, opts = {}) {
  const a = planRows(acc, family, reserve, now, opts);
  if (a.totalRows <= a.maxRows || !LIST_STYLES.includes(PROG)) return a;
  const d = planRows(acc, family, reserve, now, { ...opts, dense: true });
  return d.maxRows > a.maxRows || d.totalRows <= d.maxRows ? d : a;
}
// Timeline / grid capacity (same numbers the views use).
function timelinePlan(Havail, n) {
  const rowH = Math.max(13, Math.min(24, Math.floor((Havail - 34) / Math.max(1, n)) - 2));
  return { rowH, maxRows: Math.max(1, Math.floor((Havail - 34) / (rowH + 2))) };
}
function gridCapacity(n, Havail) {
  const cols = n <= 8 ? 4 : n <= 15 ? 5 : 6, gap = 6;
  return cols * Math.max(1, Math.floor((Havail + gap) / (60 + gap)));
}
// Does every upgrade of this account fit with `reserve` points taken by other things?
function fitsAll(acc, family, reserve, now, opts = {}) {
  if (LIST_STYLES.includes(PROG)) { const pl = planFor(acc, family, reserve, now, opts); return pl.totalRows <= pl.maxRows; }
  const { h: Hfull } = widgetSize(family);
  const Havail = Hfull - 24 - 13 - reserve - 22 - 4;
  const items = acc.items || [];
  if (PROG === "timeline") { const n = items.filter(i => i.end > now).length; return n <= timelinePlan(Havail, n).maxRows; }
  if (PROG === "grid") return items.length <= gridCapacity(items.length, Havail);
  return true; // tubes: limited by width, not height
}

// clock: { st, mode } with mode "line" (own line under the Builder Base), "pill" or
// "section" (next to the BUILDER BASE title; "section" = no Builder Base upgrades running).
function accountView(w, acc, now, family, pos, reserve = 0, topExtra = null, clock = null) {
  CUR_ACC = acc;
  const { W, H, rowW, secs, lineLike, headerH, gap, compactBB, totalRows, rowH, maxRows, dense } =
    planFor(acc, family, reserve, now, { emptyBB: !!clock && /^section/.test(clock.mode) });
  const fs = Math.max(10, Math.min(13, Math.round((lineLike ? rowH - 8 : rowH) * 0.5)));
  const timerW = Math.round(fs * 7.4) + (TH.dot ? 12 : 0);

  const top = w.addStack();
  top.layoutHorizontally(); top.centerAlignContent();
  shade(t2(top, HEADING, 9, TH.dim, "heavy"));
  top.addSpacer();
  const topRedraws = topExtra ? topExtra(top) || [] : [];
  if (topExtra) top.addSpacer(8);
  if (pos) shade(t2(top, pos, 9, TH.dim, "heavy"));
  w.addSpacer(2);

  const hd = w.addStack();
  hd.layoutHorizontally(); hd.centerAlignContent();
  shade(t2(hd, acc.name, 15, TH.text, "heavy"));
  if (!/TH\s?\d/i.test(acc.name)) { hd.addSpacer(6); shade(t2(hd, `TH${acc.th || "?"}`, 12, TH.accent, "heavy")); }
  hd.addSpacer();
  syncPill(hd, acc, 10);
  w.addSpacer(4);

  const avail = H - headerH - 4;
  if (PROG === "grid") return gridView(w, acc, now, rowW, avail).concat(topRedraws);
  if (PROG === "tubes") return tubesView(w, acc, now, rowW, avail).concat(topRedraws);
  if (PROG === "timeline") return timelineView(w, acc, now, rowW, avail).concat(topRedraws);
  const rowFn = dense ? barRow : PROG === "rings" ? ringRow : PROG === "blocks" ? blocksRow : PROG === "heat" ? heatRow
    : TH.style === "line" ? lineRow : barRow;
  const clockPill = clock && (clock.mode === "pill" || clock.mode === "section")
    ? (h) => { redraws.push(...drawClock(h, acc, clock.st, "short", now, 12)); } : null;
  const clockLine = () => {
    const r = w.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.url = CLASH_URL;
    redraws.push(...drawClock(r, acc, clock.st, "line", now, 13)); r.addSpacer();
    w.addSpacer(gap);
  };

  let shown = 0;
  const redraws = [];
  for (const s of secs) {
    if (compactBB && s.key === "bb") {
      // Builder Base side by side: one bar per upgrade (picture + live timer) in one row.
      sectionHeader(w, s.title, s.key, null, null, 10, clockPill);
      w.addSpacer(gap);
      for (const rd of bbChips(w, s.items, now, rowH, fs, rowW)) if (rd) redraws.push(rd);
      w.addSpacer(gap);
      if (clock && clock.mode === "line") clockLine();
      continue;
    }
    // keep going so a folded Builder Base line, or the Clock Tower's own title, still shows
    if (shown >= maxRows && !(s.key === "bb" && !s.items.length && clock)) continue;
    let right = null, rc = null;
    if (s.key === "builder") { const b = builderStatusText(acc, now); right = b.s; rc = b.c; }
    else if (s.key === "lab" && !activeAt(acc, "lab", now).length) { right = "idle"; rc = TH.idle; }
    else if (s.key === "lab" && goblinCounts(acc, now).lab) { right = "+ Goblin Researcher"; rc = TH.free; }
    sectionHeader(w, s.title, s.key, right, rc, 10, s.key === "bb" ? clockPill : (h) => boostPills(h, acc, s.key, now, redraws));
    w.addSpacer(gap);
    for (const it of s.items) {
      if (shown >= maxRows) break;
      const rd = rowFn(w, it, now, rowH, fs, timerW, rowW);
      if (rd) redraws.push(rd);
      w.addSpacer(gap);
      shown++;
    }
    if (s.key === "bb" && clock && (clock.mode === "line" || clock.mode === "sectionLine")) clockLine();
  }
  if (shown < totalRows) t2(w, `+${totalRows - shown} more — tap widget for full list`, 9, TH.dim);
  return redraws.concat(topRedraws);
}

// Several upgrades side by side in one row, each its own progress bar with its picture
// (or short name if there's no picture) and a live countdown. Tap one for its details.
function bbChips(w, items, now, h, fs, rowW) {
  const MAX = 3, show = items.slice(0, MAX), more = items.length - show.length, sp = 6;
  const moreW = more ? 24 : 0;
  const chipW = Math.floor((rowW - moreW - sp * (show.length - 1 + (more ? 1 : 0))) / show.length);
  const row = w.addStack(); row.layoutHorizontally(); row.centerAlignContent(); row.spacing = sp;
  const redraws = [];
  const cfs = show.length >= 3 ? Math.max(9, fs - 2) : Math.max(10, fs - 1);
  for (const it of show) {
    const c = row.addStack(); c.layoutHorizontally(); c.centerAlignContent();
    c.size = new Size(chipW, h); c.cornerRadius = Math.round(h * 0.32); c.setPadding(0, 4, 0, 4);
    c.url = rowURL(it);
    const p = progressOf(it, now), colors = fillColors(SEC_OF[it.cat]);
    if (TH.gloss) c.backgroundImage = glossBar(chipW, h, p, colors); else setBarFill(c, p, colors);
    if (getIcon(it)) addIcon(c, it, h - 6);
    else { const nm = t2(c, itemName(it), cfs - 1, TH.text, "bold"); nm.minimumScaleFactor = 0.5; shade(nm); c.addSpacer(4); }
    if (it.end <= now) shade(t2(c, "✓", cfs, TH.free, "heavy"));
    else redraws.push(addCountdown(c, it.end, now, cfs, soon(it, now) ? TH.free : TH.text));
    c.addSpacer();
  }
  if (more) shade(t2(row, `+${more}`, cfs, TH.dim, "heavy"));
  return redraws;
}

// One block per account: next builder + lab.
function overviewView(w, accs, now, family) {
  const { h: Hfull } = widgetSize(family);
  const H = Hfull - 24;
  const n = Math.min(accs.length, 5);
  const big = family === "large" || family === "extraLarge";
  const hd = w.addStack(); hd.layoutHorizontally(); hd.centerAlignContent();
  shade(t2(hd, HEADING, 14, TH.text, "heavy"));
  hd.addSpacer();
  syncPill(hd, null, 10);
  w.addSpacer(4);
  const per = Math.floor((H - 24) / n);
  let rowH = Math.max(16, Math.min(big ? 30 : 24, big ? per - 26 : per - 4));
  // Medium: slimmer bars (≥17) to fit the "progress to max" line under each account.
  let progSmall = false;
  if (!big && accs.slice(0, n).some(a => maxProgress(a, now))) {
    const r2 = Math.min(24, per - 4 - 13);
    if (r2 >= 17) { rowH = r2; progSmall = true; }
  }
  const fs = Math.max(10, Math.min(12, Math.round(rowH * 0.52)));
  const redraws = [];
  for (const a of accs.slice(0, n)) {
    if (big) {
      const h = w.addStack(); h.layoutHorizontally(); h.centerAlignContent();
      shade(t2(h, a.name, 13, TH.text, "heavy")); h.addSpacer(5);
      if (!/TH\s?\d/i.test(a.name)) shade(t2(h, `TH${a.th || "?"}`, 10, TH.accent, "heavy"));
      h.addSpacer();
      const wr = warFor(a);
      if (wr) {
        shade(t2(h, wr.type === "cwl" ? "⚔️ CWL " : wr.type === "friendly" ? "🤝 " : "⚔️ ", 9.5, TH.accent, "heavy"));
        redraws.push(addCountdown(h, wr.state === "preparation" && wr.start > now ? wr.start : wr.end, now, 9.5, TH.accent));
        h.addSpacer(6);
      }
      const b = builderStatusText(a, now);
      shade(t2(h, b.s, 10, b.c, "semibold"));
      w.addSpacer(2);
    }
    const r = w.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.spacing = 6;
    const progRoom = big && per - rowH - 26 >= 16;
    if (!big) { const nm = r.addStack(); nm.size = new Size(78, rowH); nm.centerAlignContent(); shade(t2(nm, a.name, fs, TH.text, "heavy")); nm.addSpacer(); }
    for (const cat of ["builder", "lab"]) {
      const it = activeAt(a, cat, now)[0];
      const total = builderCount(a);
      const freeB = cat === "builder" && total && activeAt(a, "builder", now).length < total;
      const b = r.addStack(); b.layoutHorizontally(); b.centerAlignContent();
      b.size = new Size(0, rowH); b.cornerRadius = Math.round(rowH * 0.32); b.setPadding(0, 6, 0, 6);
      b.url = CLASH_URL;
      if (freeB || !it) {
        b.backgroundColor = TH.track;
        shade(t2(b, cat === "builder" ? "🔨 free" : "⚗️ idle", fs, cat === "builder" ? TH.free : TH.idle, "heavy"));
        b.addSpacer();
      } else {
        setBarFill(b, progressOf(it, now, a), fillColors(cat));
        addIcon(b, it, rowH - 6);
        redraws.push(addCountdown(b, it.end, now, fs));
      }
    }
    if (progRoom) { w.addSpacer(4); progressLine(w, a, now); }
    if (progSmall && maxProgress(a, now)) {
      w.addSpacer(2);
      const pl = w.addStack(); pl.layoutHorizontally(); pl.addSpacer(84); // under the bars, not the name
      progressLine(pl, a, now);
    } else if (progSmall) w.addSpacer(13);
    w.addSpacer(big ? 8 : 4);
  }
  return redraws;
}

function smallView(w, accs, now) {
  shade(t2(w, "NEXT DONE", 11, TH.accent, "heavy"));
  w.addSpacer(5);
  const all = [];
  for (const a of accs) for (const it of a.items || []) if (it.end > now) all.push({ a, it });
  all.sort((x, y) => x.it.end - y.it.end);
  if (!all.length) { t2(w, "Nothing upgrading", 12, TH.dim); return []; }
  const redraws = [];
  for (const { a, it } of all.slice(0, 3)) {
    shade(t2(w, `${a.name} · ${itemName(it)}`, 10, TH.dim, "semibold"));
    const r = w.addStack(); r.layoutHorizontally(); r.centerAlignContent();
    r.size = new Size(0, 18); r.cornerRadius = 6; r.setPadding(0, 6, 0, 4);
    setBarFill(r, progressOf(it, now, a), fillColors(SEC_OF[it.cat]));
    redraws.push(addCountdown(r, it.end, now, 11));
    w.addSpacer(4);
  }
  return redraws;
}

function buildWidget(db, family, param, themeOverride, progOverride) {
  const { acct, theme, prog } = parseParam(param);
  const st = loadSettings();
  TH = THEMES[themeOverride || theme || st.theme || "elixir"] || THEMES.elixir;
  PROG = PROGRESS[progOverride || prog || st.progress] ? (progOverride || prog || st.progress) : "bars";

  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = TH.bg; g.locations = [0, 1];
  g.startPoint = new Point(0, 0); g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
  w.setPadding(12, 12, 12, 12);
  w.url = URLScheme.forRunningScript();
  const now = Date.now();
  const accs = orderedAccounts(db);

  if (!accs.length) {
    t2(w, "CoC Tracker", 14, TH.accent, "heavy");
    w.addSpacer(4);
    const t = w.addText("No accounts yet.\nIn Clash: Settings → More Settings → Data Export → Copy, then close the game.");
    t.font = Font.systemFont(11); t.textColor = TH.dim;
    return w;
  }

  // One account only: show its full view even without a Parameter.
  const single = findAccount(db, acct) || (accs.length === 1 && family !== "small" ? accs[0] : null);
  const badParam = acct && !findAccount(db, acct) && accs.length > 1;
  let redraws = [];

  if (String(family || "").startsWith("accessory")) {
    for (const a of (single ? [single] : accs).slice(0, family === "accessoryRectangular" ? 3 : 1)) {
      const total = builderCount(a), b = activeAt(a, "builder", now);
      const free = total ? Math.max(0, total - b.length) : 0;
      const r = w.addStack(); r.layoutHorizontally();
      t2(r, `${a.name} `, 12, Color.white(), "semibold");
      if (free) t2(r, `🔨 ${free} free`, 12, Color.white(), "semibold");
      else if (b[0]) { t2(r, "🔨 ", 12, Color.white()); addCountdown(r, b[0].end, now, 12, Color.white()); }
    }
    return w;
  }

  if (single) {
    const i = accs.indexOf(single);
    const big = family === "large" || family === "extraLarge";
    const war = big ? warFor(single) : null;
    // Helper strip: the most detailed version that still leaves room for every upgrade:
    // full text on one line, then on two lines, then short (times only) on one line.
    // Upgrades come first: if even the short one doesn't fit, the strip is left out.
    // Clock Tower: on its own line under the Builder Base, else next to its title; with no
    // Builder Base upgrades running, a Builder Base title just for it, else in the strip.
    // (Timeline / grid / tubes have no Builder Base section: always in the strip.)
    const hs = big ? helperStatus(single, now) : [];
    const cst = big ? clockStatus(single, now) : null;
    const stripW = widgetSize(family).w - 24, warH = war ? 36 : 0;
    const hasBB = (single.items || []).some(i => ["bb", "starlab", "other"].includes(i.cat));
    const clockModes = !cst ? [null] : LIST_STYLES.includes(PROG) ? (hasBB ? ["line", "pill"] : ["sectionLine", "section", "strip"]) : ["strip"];
    // Raid Weekend: its own strip at the bottom, else a chip next to the helpers.
    const rd = big ? raidFor(single, loadWars(), now) : null;
    const raidModes = rd ? ["box", "chip"] : [null];
    const raidChip = rd ? { key: "raid", left: raidAttacksLeft(rd, single), until: 0 } : null;
    // Clan Games (only while they run, only for an account in a clan): strip, else chip.
    const gOn = big && single.clan && inGames(now);
    const gPts = gOn ? gamesPoints(single, now) : null;
    const gamesModes = gOn ? ["box", "chip"] : [null];
    const gamesChip = gOn ? { key: "games", pts: gPts, until: 0 } : null;
    let pick = null;
    for (const gm of gamesModes) {
    for (const rm of raidModes) {
    for (const cm of clockModes) {
      const chips = (cm === "strip" ? hs.concat([{ key: "clock", st: cst, until: cst.until, acc: single }]) : hs).concat(rm === "chip" ? [raidChip] : [], gm === "chip" ? [gamesChip] : []);
      const opts = [];
      if (chips.length) {
        const full = stripLines(chips, "full", stripW, now);
        if (full.length <= 2) opts.push({ mode: "full", h: stripHeight(full) });
        opts.push({ mode: "compact", h: stripHeight(stripLines(chips, "compact", stripW, now)) });
        opts.push({ mode: "compact", h: 0, top: true }); // short version in the top line: no extra height
      } else opts.push(null);
      for (const o of opts) {
        const reserve = warH + (o && !o.top ? o.h + 8 : 0) + (cm === "line" || cm === "sectionLine" ? 17 : 0) + (rm === "box" ? RAID_BOX_H + 6 : 0) + (gm === "box" ? RAID_BOX_H + 6 : 0);
        const cand = { cm, rm, gm, o, chips, reserve };
        if (fitsAll(single, family, reserve, now, { emptyBB: cm === "section" || cm === "sectionLine" })) { pick = cand; break; }
        pick = pick || null; var last = cand;
      }
      if (pick) break;
    }
    if (pick) break;
    }
    if (pick) break;
    }
    pick = pick || last || { cm: null, o: null, chips: hs, reserve: warH };
    const strip = pick.o, chips = pick.chips;
    const topExtra = strip && strip.top ? (stack) => drawHelperChips(stack, chips, "compact", now, 7, 11) : null;
    const clockArg = pick.cm && pick.cm !== "strip" ? { st: cst, mode: pick.cm } : null;
    redraws = accountView(w, single, now, family, accs.length > 1 ? `${i + 1}/${accs.length}` : "", pick.reserve, topExtra, clockArg);
    w.addSpacer();
    if (strip && !strip.top) { redraws.push(...drawHelperStrip(w, chips, strip.mode, stripW, now)); if (war || pick.rm === "box" || pick.gm === "box") w.addSpacer(9); }
    if (pick.gm === "box") { redraws.push(gamesFooter(w, single, gPts, now)); if (war || pick.rm === "box") w.addSpacer(6); }
    if (pick.rm === "box") { redraws.push(raidFooter(w, single, rd, now)); if (war) w.addSpacer(6); }
    if (war) redraws.push(warFooter(w, single, war, now, family));
  } else if (family === "small") redraws = smallView(w, accs, now);
  else redraws = overviewView(w, accs, now, family);
  if (badParam && !single) {
    w.addSpacer(4);
    const t = t2(w, `Parameter "${acct}" didn't match an account. Use 1–${accs.length} or the account's name.`, 9, TH.idle, "semibold");
    t.lineLimit = 2;
  }

  w.addSpacer();
  let next = now + 15 * 60 * 1000;
  for (const a of accs) for (const it of a.items || []) if (it.end > now) next = Math.min(next, it.end + 5000);
  for (const rd of redraws) if (rd && rd > now) next = Math.min(next, rd + 1000);
  w.refreshAfterDate = new Date(next);
  return w;
}

// ─────────────────────────── Progress styles ───────────────────────────────
// Pick the default in the menu (📊 Progress style). Any widget can override it in
// its Parameter, e.g.  1, rings   or   Main | clash | timeline
const PROGRESS = {
  bars: "Bars (theme default)", rings: "Progress rings", grid: "Tile grid", blocks: "Segmented blocks",
  tubes: "Elixir tubes", timeline: "Timeline", heat: "Heat bar + %",
};
const PROG_ORDER = ["bars", "rings", "grid", "blocks", "tubes", "timeline", "heat"];
const PROG_ALIASES = { bar: "bars", ring: "rings", tile: "grid", tiles: "grid", block: "blocks", battery: "blocks",
  tube: "tubes", elixir: "tubes", gantt: "timeline", heatbar: "heat", percent: "heat" };
let PROG = "bars";

function findProg(word) {
  const w = String(word || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return null;
  if (PROGRESS[w]) return w;
  if (PROG_ALIASES[w]) return PROG_ALIASES[w];
  for (const k of PROG_ORDER) if (w.length >= 4 && PROGRESS[k].toLowerCase().replace(/[^a-z]/g, "").startsWith(w)) return k;
  return null;
}

function secColor(it) { const c = fillColors(SEC_OF[it.cat]); return c[1]; }

function heatColor(p) {
  const a = [255, 120, 60], b = [255, 205, 70], c = [70, 210, 110];
  const [x, y, q] = p < 0.5 ? [a, b, p / 0.5] : [b, c, (p - 0.5) / 0.5];
  const h = x.map((v, i) => Math.round(v + (y[i] - v) * q).toString(16).padStart(2, "0")).join("");
  return new Color("#" + h);
}

// Countdown split in two lines (for narrow spaces): "1d" / "0:05:07"
function addCountdownV(parent, end, now, size, color) {
  const left = end - now;
  const days = Math.floor(left / 864e5);
  const target = end - days * 864e5;
  const r = target - now;
  let next = target;
  const center = (s) => { const h = parent.addStack(); h.layoutHorizontally(); h.addSpacer(); return h; };
  if (days > 0) { const h = center(); shade(t2(h, `${days}d`, size, color || TH.text, "bold")); h.addSpacer(); }
  const h = center();
  if (days > 0) {
    let pre = "";
    if (r < 6e5) pre = "0:0"; else if (r < 36e5) { pre = "0:"; next = target - 6e5; } else next = target - 36e5;
    if (pre) shade(t2(h, pre, size, color || TH.text, "bold"));
  }
  const d = h.addDate(new Date(target));
  d.applyTimerStyle(); d.font = Font.boldMonospacedSystemFont(size); d.textColor = color || TH.text;
  d.leftAlignText(); d.lineLimit = 1; d.minimumScaleFactor = 0.5; shade(d);
  h.addSpacer();
  return next;
}

// Ring drawn as an image, with the item's picture (or a letter tile) inside.
function ringImage(it, p, size, color) {
  const S = Math.round(size);
  const dc = new DrawContext();
  dc.size = new Size(S, S); dc.opaque = false; dc.respectScreenScale = true;
  const lw = Math.max(2.5, S * 0.1), r = (S - lw) / 2, cx = S / 2, cy = S / 2;
  const pt = (t) => { const a = -Math.PI / 2 + 2 * Math.PI * t; return new Point(cx + r * Math.cos(a), cy + r * Math.sin(a)); };
  const arc = (to, col) => {
    const n = Math.max(2, Math.ceil(72 * to)), pts = [];
    for (let i = 0; i <= n; i++) pts.push(pt(to * i / n));
    const path = new Path(); path.addLines(pts);
    dc.addPath(path); dc.setStrokeColor(col); dc.setLineWidth(lw); dc.strokePath();
  };
  arc(1, TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.18) : TH.track);
  if (p > 0.004) {
    arc(Math.min(1, p), color);
    dc.setFillColor(color);
    for (const t of [0, Math.min(1, p)]) { const q = pt(t); dc.fillEllipse(new Rect(q.x - lw / 2, q.y - lw / 2, lw, lw)); }
  }
  const inner = S - lw * 2 - S * 0.14, off = (S - inner) / 2;
  const img = getIcon(it);
  if (img) dc.drawImageInRect(img, new Rect(off, off, inner, inner));
  else {
    const path = new Path(); path.addRoundedRect(new Rect(off, off, inner, inner), inner * 0.25, inner * 0.25);
    dc.addPath(path); dc.setFillColor(color); dc.fillPath();
    dc.setFont(Font.heavySystemFont(inner * 0.5)); dc.setTextColor(new Color("#000000", 0.55)); dc.setTextAlignedCenter();
    dc.drawTextInRect(itemName(it)[0] || "?", new Rect(off, off + inner * 0.2, inner, inner));
  }
  return dc.getImage();
}

// A · ring around the picture, % and timer
function ringRow(parent, it, now, h, fs, timerW) {
  const r = parent.addStack();
  r.layoutHorizontally(); r.centerAlignContent(); r.size = new Size(0, h); r.url = rowURL(it);
  const p = progressOf(it, now);
  const im = r.addImage(ringImage(it, p, h, secColor(it)));
  im.imageSize = new Size(h, h);
  r.addSpacer(6);
  nameAndLevel(r, it, fs);
  shade(t2(r, it.end <= now ? "" : `${Math.floor(p * 100)}%`, fs - 2, secColor(it), "heavy"));
  r.addSpacer(6);
  return addTimerCol(r, it, now, h, fs, timerW);
}

// C · battery-style blocks under each row
function blocksRow(parent, it, now, h, fs, timerW, rowW) {
  const v = parent.addStack(); v.layoutVertically(); v.url = rowURL(it);
  const textH = h - 8;
  const r = v.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.size = new Size(0, textH);
  addIcon(r, it, Math.min(textH, 15));
  nameAndLevel(r, it, fs);
  const rd = addTimerCol(r, it, now, textH, fs, timerW);
  v.addSpacer(2);
  const N = 12, gap = 2, pw = Math.floor((rowW - gap * (N - 1)) / N);
  const k = Math.round(progressOf(it, now) * N);
  const row = v.addStack(); row.layoutHorizontally(); row.spacing = gap;
  for (let i = 0; i < N; i++) {
    const b = row.addStack(); b.size = new Size(pw, 5); b.cornerRadius = 2;
    b.backgroundColor = i < k ? secColor(it) : (TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.12) : TH.track);
  }
  return rd;
}

// F · colour that shifts orange → green, with a % pill
function heatRow(parent, it, now, h, fs, timerW, rowW) {
  const p = progressOf(it, now), col = heatColor(p);
  const v = parent.addStack(); v.layoutVertically(); v.url = rowURL(it);
  v.cornerRadius = 8; v.backgroundColor = TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.08) : TH.track;
  const r = v.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.size = new Size(rowW, h - 3); r.setPadding(0, 5, 0, 4);
  addIcon(r, it, Math.min(h - 9, 18));
  nameAndLevel(r, it, fs);
  const pill = r.addStack(); pill.backgroundColor = col; pill.cornerRadius = 5; pill.setPadding(1, 5, 1, 5);
  t2(pill, it.end <= now ? "100%" : `${Math.floor(p * 100)}%`, fs - 3, new Color("#111111"), "heavy");
  r.addSpacer(6);
  const rd = addTimerCol(r, it, now, h - 3, fs, timerW);
  const line = v.addStack(); line.size = new Size(rowW, 3);
  const g = new LinearGradient(); g.startPoint = new Point(0, 0.5); g.endPoint = new Point(1, 0.5);
  g.colors = [col, col, new Color("#000000", 0), new Color("#000000", 0)];
  g.locations = [0, Math.max(p, 0.0001), Math.min(1, p + 0.001), 1];
  line.backgroundGradient = g;
  return rd;
}

function centerRow(parent) { const h = parent.addStack(); h.layoutHorizontally(); h.addSpacer(); return h; }

// B · grid of tiles with big rings
function gridView(w, acc, now, rowW, Havail) {
  const items = (acc.items || []).slice().sort((a, b) => a.end - b.end);
  const redraws = [];
  if (!items.length) { t2(w, "Nothing upgrading", 12, TH.idle); return redraws; }
  const n = items.length, cols = n <= 8 ? 4 : n <= 15 ? 5 : 6, gap = 6;
  let rows = Math.ceil(n / cols);
  const tileW = Math.floor((rowW - gap * (cols - 1)) / cols);
  let tileH = Math.floor((Havail - gap * (rows - 1)) / rows);
  const maxRows = Math.max(1, Math.floor(gridCapacity(n, Havail) / cols));
  if (rows > maxRows) { rows = maxRows; tileH = Math.floor((Havail - gap * (rows - 1)) / rows); }
  tileH = Math.min(tileH, tileW + 30);
  const ring = Math.max(22, Math.min(54, tileH - 32, tileW - 14));
  const fs = tileW < 66 ? 8 : 9;
  let shown = 0;
  for (let r = 0; r < rows; r++) {
    const line = w.addStack(); line.layoutHorizontally(); line.spacing = gap;
    for (let c = 0; c < cols; c++) {
      const it = items[r * cols + c];
      if (!it) break;
      const t = line.addStack(); t.layoutVertically(); t.size = new Size(tileW, tileH); t.cornerRadius = 12;
      t.backgroundColor = TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.07) : TH.track;
      t.setPadding(5, 2, 4, 2); t.url = rowURL(it);
      const top = centerRow(t);
      const im = top.addImage(ringImage(it, progressOf(it, now, acc), ring, secColor(it)));
      im.imageSize = new Size(ring, ring); top.addSpacer();
      t.addSpacer(2);
      const nm = centerRow(t); const nt = shade(t2(nm, itemName(it), fs, TH.text, "bold")) || null; nm.addSpacer();
      if (it.end <= now) { const d = centerRow(t); shade(t2(d, "✓ Done", fs, TH.free, "heavy")); d.addSpacer(); }
      else redraws.push(addCountdownV(t, it.end, now, fs, secColor(it)));
      shown++;
    }
    w.addSpacer(gap);
  }
  if (shown < n) t2(w, `+${n - shown} more — tap widget for full list`, 9, TH.dim);
  return redraws;
}

// D · vertical tubes that fill up
function tubesView(w, acc, now, rowW, Havail) {
  const all = (acc.items || []).slice().sort((a, b) => a.end - b.end);
  const builders = all.filter(i => i.cat === "builder"), others = all.filter(i => i.cat !== "builder");
  const redraws = [];
  const hd = w.addStack(); hd.layoutHorizontally(); hd.centerAlignContent();
  shade(t2(hd, "BUILDERS ", 10, TH.sec.builder || TH.accent, "heavy"));
  const b = builderStatusText(acc, now); shade(t2(hd, b.s, 9, b.c, "semibold"));
  hd.addSpacer();
  if (others.length) shade(t2(hd, "LAB · PETS · BB", 9, TH.dim, "heavy"));
  w.addSpacer(4);
  const maxCols = Math.min(13, Math.floor(rowW / 25));
  const list = builders.concat(others).slice(0, maxCols);
  if (!list.length) { t2(w, "Nothing upgrading", 12, TH.idle); return redraws; }
  const divider = builders.length && others.length && list.length > builders.length;
  const colW = Math.floor((rowW - (divider ? 9 : 0)) / list.length);
  const tubeW = Math.max(10, Math.min(20, colW - 10));
  const fs = colW < 34 ? 7.5 : 8.5;
  const tubeH = Math.max(50, Havail - 16 - 22 - 6 - 26 - 22);
  const row = w.addStack(); row.layoutHorizontally(); row.topAlignContent();
  list.forEach((it, i) => {
    if (divider && i === builders.length) {
      row.addSpacer(4); const d = row.addStack(); d.size = new Size(1, tubeH + 22); d.backgroundColor = new Color("#ffffff", 0.12); row.addSpacer(4);
    }
    const col = row.addStack(); col.layoutVertically(); col.size = new Size(colW, 0); col.url = rowURL(it);
    const ic = centerRow(col); addIcon(ic, it, Math.min(22, colW - 6)); ic.addSpacer();
    col.addSpacer(4);
    const tw = centerRow(col);
    const tube = tw.addStack(); tube.size = new Size(tubeW, tubeH); tube.cornerRadius = tubeW / 2;
    const p = progressOf(it, now, acc), c = secColor(it);
    const g = new LinearGradient(); g.startPoint = new Point(0.5, 1); g.endPoint = new Point(0.5, 0);
    const track = TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.1) : TH.track;
    g.colors = [c, c, track, track]; g.locations = [0, Math.max(p, 0.0001), Math.min(1, p + 0.001), 1];
    tube.backgroundGradient = g; tw.addSpacer();
    col.addSpacer(4);
    if (it.end <= now) { const d = centerRow(col); shade(t2(d, "Done", fs, TH.free, "heavy")); d.addSpacer(); }
    else redraws.push(addCountdownV(col, it.end, now, fs, TH.text));
    const nm = centerRow(col); const nt = t2(nm, itemName(it), fs - 0.5, TH.dim, "semibold"); nt.lineLimit = 2; nt.centerAlignText(); nm.addSpacer();
  });
  if (all.length > list.length) { w.addSpacer(2); t2(w, `+${all.length - list.length} more — tap widget for full list`, 9, TH.dim); }
  return redraws;
}

// E · timeline: everything on one shared clock, sorted by finish
function timelineView(w, acc, now, rowW, Havail) {
  const items = (acc.items || []).filter(i => i.end > now).sort((a, b) => a.end - b.end);
  const redraws = [];
  shade(t2(w, "FINISH ORDER", 10, TH.accent, "heavy"));
  w.addSpacer(3);
  if (!items.length) { t2(w, "Nothing upgrading", 12, TH.idle); return redraws; }
  const spanDays = Math.max(1, Math.ceil((items[items.length - 1].end - now) / 864e5));
  const span = spanDays * 864e5;
  const labelW = 96, trackW = rowW - labelW - 4;
  const { rowH, maxRows } = timelinePlan(Havail, items.length);
  const fs = rowH < 19 ? 9.5 : 10.5;
  for (const it of items.slice(0, maxRows)) {
    const r = w.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.size = new Size(0, rowH); r.url = rowURL(it);
    const lab = r.addStack(); lab.layoutHorizontally(); lab.centerAlignContent(); lab.size = new Size(labelW, rowH);
    addIcon(lab, it, Math.min(14, rowH - 4)); shade(t2(lab, itemName(it), fs, TH.text, "bold")); lab.addSpacer();
    r.addSpacer(4);
    const tr = r.addStack(); tr.layoutHorizontally(); tr.centerAlignContent(); tr.size = new Size(trackW, rowH);
    const fw = Math.max(6, Math.round(trackW * Math.min(1, (it.end - now) / span)));
    const label = fmtLeft(it.end - now).split(" ")[0];
    const bar = tr.addStack(); bar.size = new Size(fw, Math.round(rowH * 0.5)); bar.cornerRadius = rowH * 0.25;
    bar.backgroundColor = secColor(it);
    if (trackW - fw > 30) { tr.addSpacer(4); shade(t2(tr, label, fs - 1, TH.sub, "bold")); }
    else { bar.layoutHorizontally(); bar.centerAlignContent(); bar.addSpacer(); t2(bar, label + " ", fs - 1.5, new Color("#111111"), "heavy"); }
    tr.addSpacer();
    w.addSpacer(2);
  }
  // axis
  const ax = w.addStack(); ax.layoutHorizontally(); ax.addSpacer(labelW + 4);
  const step = Math.max(1, Math.ceil(spanDays / 5)), segs = Math.ceil(spanDays / step);
  const segW = Math.floor(trackW * (step / spanDays));
  for (let i = 0; i < segs; i++) {
    const s = ax.addStack(); s.size = new Size(Math.min(segW, trackW - segW * i), 10);
    t2(s, i === 0 ? "now" : `+${i * step}d`, 8, TH.dim, "semibold"); s.addSpacer();
  }
  if (items.length > maxRows) { w.addSpacer(2); t2(w, `+${items.length - maxRows} more — tap widget for full list`, 9, TH.dim); }
  return redraws;
}

// ───────────────────────────────── Wars ────────────────────────────────────
// Clan + current war / CWL war from the official Clash API, via ClashKing's free
// public proxy (no key needed). Regular wars need the clan's war log to be public.
const API_BASE = "https://proxy.clashk.ing/v1/";
const WAR_PREFIX = "coc-war|";
let WARS_PATH;

const encTag = (t) => encodeURIComponent(t.startsWith("#") ? t : "#" + t);
function cocTime(s) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(s || "");
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
}

// Sources tried in order: ClashKing's free proxy, then (if you added one) your own
// official API key through RoyaleAPI's proxy (key must allow IP 45.79.218.79).
// Your own key (if added) is tried first; ClashKing is skipped for 30 min after it times out.
let CK_DOWN_UNTIL = 0;
function apiSources() {
  const st = loadSettings();
  const key = (st.apiKey || "").trim();
  const list = [];
  if (key) list.push({ base: "https://cocproxy.royaleapi.dev/v1/", key, name: "your API key" });
  if (Date.now() > Math.max(CK_DOWN_UNTIL, st.ckDownUntil || 0)) list.push({ base: API_BASE, name: "ClashKing" });
  return list;
}
function markClashKingDown() {
  CK_DOWN_UNTIL = Date.now() + 30 * 60 * 1000;
  try { const st = loadSettings(); st.ckDownUntil = CK_DOWN_UNTIL; saveSettings(st); } catch (e) { }
}

async function apiGet(path) {
  let last = { error: "no source", reason: "ClashKing didn't respond recently; add a backup key or try again in 30 min" };
  for (const src of apiSources()) {
    try {
      const r = new Request(src.base + path);
      r.timeoutInterval = IS_WIDGET() ? 4 : 8; // widgets get little time to draw
      r.headers = src.key ? { Accept: "application/json", Authorization: "Bearer " + src.key } : { Accept: "application/json" };
      const raw = await r.loadString();
      const code = r.response && r.response.statusCode;
      let j = null;
      try { j = JSON.parse(raw); } catch (e) { }
      if ((!code || code === 200) && j && !j.reason) return j;
      last = { error: code || "bad reply", reason: (j && (j.reason || j.message)) || String(raw || "").slice(0, 90), via: src.name };
      if (src.key && code === 403 && j && j.reason === "accessDenied.invalidIp") last.reason = "key doesn't allow IP 45.79.218.79";
      // Real answers from the game's data: not found / private war log. No point asking elsewhere.
      if (code === 404 || (j && j.reason === "accessDenied")) return last;
    } catch (e) {
      last = { error: "network", reason: String(e).slice(0, 90), via: src.name };
      if (src.name === "ClashKing") markClashKingDown();
    }
  }
  return last;
}

function loadWars() {
  try { if (fm.fileExists(WARS_PATH)) return JSON.parse(fm.readString(WARS_PATH)); } catch (e) { }
  return {};
}
function saveWars(w) { fm.writeString(WARS_PATH, JSON.stringify(w)); }

// Player → clan (name, tag, badge) and Clan Games total. Every 6 hours; during
// Clan Games like the wars (~30 min in the widget, ~10 min in the app).
async function refreshClan(acc, force) {
  const now = Date.now();
  const maxAge = inGames(now) ? (IS_WIDGET() ? 30 : 10) * 60 * 1000 : 6 * 36e5;
  if (!force && acc.clanChecked && now - acc.clanChecked < maxAge) return acc.clan;
  const p = await apiGet(`players/${encTag(acc.tag)}`);
  if (p.error) { acc.clanErr = `${p.error}${p.reason ? " · " + p.reason : ""}${p.via ? " (" + p.via + ")" : ""}`; return acc.clan; }
  acc.clanErr = null;
  acc.clanChecked = now;
  acc.clan = p.clan ? { tag: p.clan.tag, name: p.clan.name, badge: p.clan.badgeUrls && p.clan.badgeUrls.small } : null;
  if (p.name) acc.gameName = p.name;
  noteGames(acc, gcValue(p), now);
  if (inGames(now) && acc.cg && gamesPoints(acc, now) === null) { try { await ckGamesBase(acc, now); } catch (e) { } }
  return acc.clan;
}

// ── Clan Games: the 22nd 08:00 → the 28th 08:00 UTC, every month ──
// The "Games Champion" achievement counts every Clan Games point ever earned, so
// points this time = total now − total before the start (saved outside the Games).
// The first time (no total from before the start yet), ClashKing's history is used.
// 4,000: the extra reward · 10,000: the most one player can earn (the goal shown).
const CG_BONUS = 4000, CG_MAX = 10000, CK_API = "https://api.clashk.ing/v2/";
function gamesWindow(t) {
  const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth();
  return { start: Date.UTC(y, m, 22, 8), end: Date.UTC(y, m, 28, 8), prevEnd: Date.UTC(y, m - 1, 28, 8) };
}
function inGames(t) { const g = gamesWindow(t); return t >= g.start && t < g.end; }
function nextGamesStart(t) {
  const g = gamesWindow(t);
  if (t < g.start) return g.start;
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 22, 8);
}
function gcValue(p) {
  const a = (p && Array.isArray(p.achievements) ? p.achievements : []).find(x => x && x.name === "Games Champion");
  return a && typeof a.value === "number" ? a.value : null;
}
function noteGames(acc, value, now) {
  if (value === null) return;
  acc.cg = { value, at: now };
  if (!inGames(now)) acc.cgBase = { value, at: now, src: "api" };
}
// Points in the Clan Games running now (null: not running, or not known).
function gamesPoints(acc, now) {
  if (!inGames(now) || !acc.cg) return null;
  const g = gamesWindow(now), b = acc.cgBase;
  if (!b || b.at >= g.start || b.at < g.prevEnd || acc.cg.value < b.value) return null;
  return Math.min(CG_MAX, acc.cg.value - b.value);
}
async function ckGamesBase(acc, now) {
  if (acc.cgTry && now - acc.cgTry < 36e5) return; // at most once an hour
  acc.cgTry = now;
  const g = gamesWindow(now);
  const get = async (q) => {
    try {
      const r = new Request(`${CK_API}player/${encTag(acc.tag)}/history/stats?type=clan_games&${q}`);
      r.timeoutInterval = IS_WIDGET() ? 4 : 8;
      r.headers = { Accept: "application/json" };
      const raw = await r.loadString();
      const code = r.response && r.response.statusCode;
      if (code && code !== 200) return null;
      const j = JSON.parse(raw);
      return Array.isArray(j.items) ? j.items : null;
    } catch (e) { return null; }
  };
  const when = (x) => { const v = Date.parse(x.eventTime); return isNaN(v) ? cocTime(x.eventTime) : v; };
  const since = await get(`limit=100&time%5Bafter%5D=${encodeURIComponent(new Date(g.start).toISOString())}`);
  if (!since) return;
  const after = since.filter(x => when(x) >= g.start && typeof x.previousValue === "number").sort((a, b) => when(a) - when(b));
  if (after.length) {
    if (after[0].previousValue <= acc.cg.value) acc.cgBase = { value: after[0].previousValue, at: g.start - 1000, src: "ClashKing" };
    return;
  }
  // Nothing since the start: 0 points, if ClashKing follows this player at all.
  const last = await get("limit=1");
  if (last && last.length && last[0].currentValue === acc.cg.value) acc.cgBase = { value: acc.cg.value, at: g.start - 1000, src: "ClashKing" };
}
const fmtNum = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function gamesAlertHours() { const v = loadSettings().gamesAlert; return v === undefined || v === null ? 12 : v; }
const GAMES_PREFIX = "coc-games|";
async function scheduleGamesAlerts(db) {
  const hrs = gamesAlertHours();
  const pending = await Notification.allPending();
  const ours = pending.map(n => n.identifier).filter(id => id && id.startsWith(GAMES_PREFIX));
  if (ours.length) await Notification.removePending(ours);
  if (!hrs) return 0;
  const now = Date.now(), accs = orderedAccounts(db).filter(a => a.clan);
  if (!accs.length) return 0;
  let n = 0;
  const add = async (id, title, body, at) => {
    const nt = new Notification();
    nt.identifier = GAMES_PREFIX + id; nt.threadIdentifier = "coc-games";
    nt.title = title; nt.body = body; nt.sound = "alert"; nt.openURL = CLASH_URL;
    nt.setTriggerDate(new Date(at)); await nt.schedule(); n++;
  };
  // The start of the next Clan Games.
  const st = nextGamesStart(now);
  await add(`start|${st}`, "🎮 Clan Games started", `Until the 28th · up to ${fmtNum(CG_MAX)} points each, ${fmtNum(CG_BONUS)} for the extra reward.`, st);
  // Before the end: who is still under 4,000.
  if (inGames(now)) {
    const g = gamesWindow(now), at = g.end - hrs * 36e5;
    const low = accs.map(a => ({ a, p: gamesPoints(a, now) })).filter(x => x.p === null || x.p < CG_MAX);
    if (at > now + 30000 && low.length)
      await add(`end|${g.end}`, `🎮 Clan Games end in ${hrs}h`,
        `Under ${fmtNum(CG_MAX)}: ${low.map(x => `${x.a.name} ${x.p === null ? "?" : fmtNum(x.p) + (x.p < CG_BONUS ? " (no extra reward yet)" : "")}`).join(", ")}`, at);
  }
  return n;
}
// The first Clan Games after installing has no total from before the start: the user
// types the points the game shows once, and the start is worked out from them.
async function gamesSetFlow() {
  if (!inGames(Date.now())) {
    await info("Clan Games aren't running", `Next ones start ${fmtClock(nextGamesStart(Date.now()))}. Points are counted by themselves.`);
    return;
  }
  while (true) {
    const db = loadDB(), now = Date.now();
    const accs = orderedAccounts(db);
    if (!accs.length) { await info("No accounts yet", "Copy a Data Export in Clash first."); return; }
    const a = new Alert();
    a.title = "Clan Games points";
    a.message = "Type the points each account has in these Clan Games (the Clan Games screen in the game). Only needed this time: from next month they're counted by themselves.";
    for (const x of accs) { const pt = gamesPoints(x, now); a.addAction(`${x.name}: ${pt === null ? "unknown" : fmtNum(pt) + " / " + fmtNum(CG_MAX)}`); }
    a.addCancelAction("Done");
    const i = await a.presentSheet();
    if (i < 0) return;
    const acc = db.accounts[accs[i].tag];
    try { await refreshClan(acc, true); } catch (e) { } // the total right now
    if (!acc.cg) {
      saveDB(db);
      await info("Couldn't read the total", `The game's API didn't answer for ${acc.name}${acc.clanErr ? " (" + acc.clanErr + ")" : ""}. Try again in a bit.`);
      continue;
    }
    const t = new Alert();
    t.title = `${acc.name}: points now`;
    t.message = `From the Clan Games screen in the game (0–${fmtNum(CG_MAX)}).`;
    const cur = gamesPoints(acc, Date.now());
    t.addTextField("Points", cur === null ? "" : String(cur));
    t.addAction("Save"); t.addCancelAction("Cancel");
    if ((await t.present()) < 0) { saveDB(db); continue; }
    const raw = String(t.textFieldValue(0) || "").trim();
    const v = Number(raw.replace(/[^\d]/g, ""));
    if (!/^\d[\d.,\s]*$/.test(raw) || v > CG_MAX || v > acc.cg.value) {
      saveDB(db);
      await info("Not saved", `Use a number from 0 to ${fmtNum(CG_MAX)}.`);
      continue;
    }
    acc.cgBase = { value: acc.cg.value - v, at: gamesWindow(Date.now()).start - 1000, src: "you" };
    saveDB(db);
    await scheduleGamesAlerts(db);
  }
}
async function gamesSettingsFlow() {
  const opts = [0, 3, 6, 12, 24, 48];
  const cur = gamesAlertHours();
  const a = new Alert();
  a.title = "Clan Games alerts";
  a.message = `A notification when Clan Games start, and one before they end for accounts still under ${fmtNum(CG_MAX)} points (and which of them don't have the ${fmtNum(CG_BONUS)} for the extra reward yet).\nCurrently: ${cur ? cur + "h before the end" : "off"}`;
  for (const h of opts) a.addAction(h ? `${h} hours before the end` : "Off");
  a.addCancelAction("Cancel");
  const i = await a.presentSheet();
  if (i < 0) return;
  const st = loadSettings(); st.gamesAlert = opts[i]; saveSettings(st);
  await scheduleGamesAlerts(loadDB());
}
// Widget strip: "🎮 CLAN GAMES · 2,350 / 4,000 · ends in 3d 4h"
function gamesFooter(w, acc, pts, now) {
  const g = gamesWindow(now);
  const box = w.addStack();
  box.layoutHorizontally(); box.centerAlignContent();
  box.size = new Size(0, RAID_BOX_H);
  box.cornerRadius = 8;
  box.setPadding(0, 10, 0, 10);
  box.backgroundColor = TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.1) : TH.track;
  box.url = CLASH_URL;
  shade(t2(box, "🎮", 11)); box.addSpacer(6);
  shade(t2(box, "CLAN GAMES", 8.5, TH.accent, "heavy")); box.addSpacer(6);
  const t = gamesText(pts, "box");
  shade(t2(box, t.text, 9.5, t.color, "heavy"));
  box.addSpacer();
  shade(t2(box, "ends in ", 8.5, TH.dim, "semibold"));
  const remain = g.end - now;
  if (remain >= 864e5) {
    shade(t2(box, fmtLeft(remain), 10, TH.text, "bold"));
    return g.end - Math.floor(remain / 864e5) * 864e5;
  }
  const d = box.addDate(new Date(g.end));
  d.applyTimerStyle(); d.font = Font.boldMonospacedSystemFont(10); d.textColor = TH.text;
  d.rightAlignText(); d.lineLimit = 1; d.size = new Size(58, 0); shade(d);
  return g.end;
}
// box: "2,350 / 10,000" · "5,200 / 10,000 · 4k ✓" · "10,000 ✓" · "set points in the app menu"
// full chip: "Games 2.3k/10k" · "Games 10k ✓"; compact: "2.3k" · "✓"
// Colours: under 4,000 orange · extra reward reached: accent · 10,000: green.
function gamesText(pts, mode) {
  if (pts === null) return { text: mode === "box" ? "set points in the app menu" : mode === "full" ? "Games ?" : "?", color: TH.dim };
  const max = pts >= CG_MAX, bonus = pts >= CG_BONUS;
  const color = max ? TH.free : bonus ? TH.accent : TH.idle;
  const k = (v) => v >= 1000 ? `${Math.floor(v / 100) / 10}k`.replace(".0k", "k") : String(v);
  if (mode === "box") return { text: max ? `${fmtNum(pts)} ✓` : `${fmtNum(pts)} / ${fmtNum(CG_MAX)}${bonus ? " · 4k ✓" : ""}`, color };
  if (mode === "full") return { text: max ? `Games ${k(pts)} ✓` : `Games ${k(pts)}/10k`, color };
  return { text: max ? "✓" : k(pts), color };
}

// Friendly wars use one of these preparation lengths; regular wars use 23 hours.
const FRIENDLY_PREP_MIN = [5, 15, 30, 60, 120, 240, 360, 480, 720, 960, 1200, 1440];
function warType(w, isLeague) {
  if (isLeague) return "cwl";
  const prep = (cocTime(w.startTime) - cocTime(w.preparationStartTime)) / 60000;
  return FRIENDLY_PREP_MIN.some(m => Math.abs(prep - m) < 1) ? "friendly" : "war";
}

function summarizeWar(w, type, clanTag) {
  const ours = w.clan && w.clan.tag === clanTag ? w.clan : w.opponent;
  const theirs = ours === w.clan ? w.opponent : w.clan;
  const members = {};
  for (const m of (ours && ours.members) || []) members[m.tag] = (m.attacks || []).length;
  return {
    type, state: w.state,
    prepStart: cocTime(w.preparationStartTime), start: cocTime(w.startTime), end: cocTime(w.endTime),
    ours: ours ? ours.name : "?", theirs: theirs ? theirs.name : "?",
    oursStars: ours ? ours.stars || 0 : 0, theirsStars: theirs ? theirs.stars || 0 : 0,
    perMember: w.attacksPerMember || 1, members,
  };
}

// Current war for one clan: regular war first, then CWL.
async function fetchWar(clanTag) {
  const out = { fetched: Date.now(), war: null, note: "" };
  const cw = await apiGet(`clans/${encTag(clanTag)}/currentwar`);
  if (!cw.error && (cw.state === "inWar" || cw.state === "preparation")) {
    out.war = summarizeWar(cw, warType(cw, false), clanTag);
    return out;
  }
  if (cw.error === 403 || cw.reason === "accessDenied") out.note = "war log is private (CWL still checked)";
  else if (cw.error) out.note = `war check failed (${cw.error}${cw.reason ? " · " + cw.reason : ""})`;
  const g = await apiGet(`clans/${encTag(clanTag)}/currentwar/leaguegroup`);
  if (g.error || !Array.isArray(g.rounds) || !(g.state === "inWar" || g.state === "preparation")) {
    if (g.error && g.error !== 404) out.note += ` · CWL check failed (${g.error}${g.reason ? " · " + g.reason : ""})`;
    else if (!out.note) out.note = "not in war";
    return out;
  }
  let live = null, prep = null, calls = 0;
  for (const round of g.rounds.slice().reverse()) {
    const tags = (round.warTags || []).filter(t => t && t !== "#0");
    for (const t of tags) {
      if (calls++ > 20) break;
      const w = await apiGet(`clanwarleagues/wars/${encTag(t)}`);
      if (w.error || !w.clan || !w.opponent) continue;
      if (w.clan.tag !== clanTag && w.opponent.tag !== clanTag) continue;
      if (w.state === "inWar") live = w; else if (w.state === "preparation" && !prep) prep = w;
      break; // found our clan's war for this round
    }
    if (live) break;
  }
  const pick = live || prep;
  if (pick) out.war = summarizeWar(pick, "cwl", clanTag);
  else out.note = "CWL: no active round";
  return out;
}

// Refresh wars (and Raid Weekends) for the given accounts' clans
// (cached ~10 min, ~30 min inside the widget).
async function refreshWars(accs, force) {
  const wars = loadWars();
  const done = new Set();
  const now = Date.now(), maxAge = (IS_WIDGET() ? 30 : 10) * 60 * 1000;
  for (const a of accs) {
    await refreshClan(a, force);
    if (!a.clan || done.has(a.clan.tag)) continue;
    done.add(a.clan.tag);
    let c = wars[a.clan.tag];
    if (force || !c || now - c.fetched >= maxAge) {
      const fresh = await fetchWar(a.clan.tag);
      if (c) { fresh.raid = c.raid; fresh.raidFetched = c.raidFetched; }
      c = wars[a.clan.tag] = fresh;
    }
    if (raidDue(c, now, force, maxAge)) {
      const r = await fetchRaid(a.clan.tag);
      if (r && !r.error) c.raid = r;
      c.raidNote = r && r.error ? `raid check failed (${r.error}${r.reason ? " · " + r.reason : ""})` : "";
      c.raidFetched = now;
    }
  }
  saveWars(wars);
  return wars;
}

// ── Raid Weekend (Clan Capital): Friday 07:00 → Monday 07:00 UTC ──
function inRaidWindow(t) {
  const d = new Date(t), day = d.getUTCDay();
  const fri = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((day + 2) % 7), 7);
  return t >= fri && t < fri + 3 * 864e5;
}
function raidAlertHours() { const v = loadSettings().raidAlert; return v === undefined || v === null ? 3 : v; }
function raidDue(c, now, force, maxAge) {
  if (force) return true;
  if (!raidAlertHours()) return false;
  const age = now - (c.raidFetched || 0);
  if (inRaidWindow(now) || (c.raid && c.raid.state === "ongoing" && c.raid.end > now)) return age >= maxAge;
  return age >= 12 * 36e5;
}
async function fetchRaid(clanTag) {
  const j = await apiGet(`clans/${encTag(clanTag)}/capitalraidseasons?limit=1`);
  if (j.error) return j;
  const s = Array.isArray(j.items) ? j.items[0] : null;
  if (!s) return { state: "none", members: {} };
  const members = {};
  for (const m of s.members || []) members[m.tag] = { a: num(m.attacks), l: (num(m.attackLimit) || 5) + num(m.bonusAttackLimit) };
  return { state: s.state, start: cocTime(s.startTime), end: cocTime(s.endTime), members };
}
function raidFor(acc, wars, now = Date.now()) {
  if (!acc.clan) return null;
  const c = (wars || loadWars())[acc.clan.tag];
  const r = c && c.raid;
  return r && r.state === "ongoing" && r.end > now ? r : null;
}
// Attacks this account can still do (5 until it attacks, +1 bonus once earned).
function raidAttacksLeft(r, acc) {
  if (!r) return null;
  const m = r.members[acc.tag];
  return m ? Math.max(0, m.l - m.a) : 5;
}
const RAID_PREFIX = "coc-raid|";
async function scheduleRaidAlerts(db) {
  const hrs = raidAlertHours();
  const pending = await Notification.allPending();
  const ours = pending.map(n => n.identifier).filter(id => id && id.startsWith(RAID_PREFIX));
  if (ours.length) await Notification.removePending(ours);
  if (!hrs) return 0;
  const wars = loadWars(), now = Date.now();
  let n = 0;
  for (const [clanTag, c] of Object.entries(wars)) {
    const r = c && c.raid;
    if (!r || r.state !== "ongoing" || !(r.end > now)) continue;
    const at = r.end - hrs * 36e5;
    if (at <= now + 30000) continue;
    const left = orderedAccounts(db).filter(a => a.clan && a.clan.tag === clanTag)
      .map(a => ({ a, l: raidAttacksLeft(r, a) })).filter(x => x.l > 0);
    if (!left.length) continue; // everyone's done
    const nt = new Notification();
    nt.identifier = `${RAID_PREFIX}${clanTag}|${r.end}`;
    nt.threadIdentifier = "coc-raid";
    nt.title = `🏰 Raid Weekend ends in ${hrs}h`;
    nt.body = `Attacks left: ${left.map(x => `${x.a.name} ${x.l}`).join(", ")}`;
    nt.sound = "alert";
    nt.openURL = CLASH_URL;
    nt.setTriggerDate(new Date(at));
    await nt.schedule();
    n++;
  }
  return n;
}
async function raidSettingsFlow() {
  const opts = [0, 1, 2, 3, 6, 12, 24];
  const cur = raidAlertHours();
  const a = new Alert();
  a.title = "Raid Weekend alert";
  a.message = `A notification before the Raid Weekend (Clan Capital) ends, only for accounts that still have attacks left.\nCurrently: ${cur ? cur + "h before" : "off"}`;
  for (const h of opts) a.addAction(h ? `${h} hour${h > 1 ? "s" : ""} before` : "Off");
  a.addCancelAction("Cancel");
  const i = await a.presentSheet();
  if (i < 0) return;
  const st = loadSettings(); st.raidAlert = opts[i]; saveSettings(st);
  const db = loadDB();
  if (opts[i]) { try { await refreshWars(orderedAccounts(db), false); saveDB(db); } catch (e) { } }
  await scheduleRaidAlerts(db);
}

function warFor(acc, wars) {
  if (!acc.clan) return null;
  const c = (wars || loadWars())[acc.clan.tag];
  if (!c || !c.war) return null;
  const w = c.war, now = Date.now();
  if (w.end && w.end < now) return null;
  return w;
}
function attacksLeft(w, acc) {
  if (!w || !(acc.tag in w.members)) return null; // not in the lineup
  return Math.max(0, w.perMember - w.members[acc.tag]);
}
function warLabel(w) { return w.type === "cwl" ? "CWL War" : w.type === "friendly" ? "Friendly War" : "War"; }

// Alert X minutes before each active war ends (one per clan).
async function scheduleWarAlerts(db) {
  const mins = loadSettings().warAlert ?? 30;
  const pending = await Notification.allPending();
  const ours = pending.map(n => n.identifier).filter(id => id && id.startsWith(WAR_PREFIX));
  if (ours.length) await Notification.removePending(ours);
  if (!mins) return 0;
  const wars = loadWars(), now = Date.now();
  let n = 0;
  for (const [clanTag, c] of Object.entries(wars)) {
    const w = c && c.war;
    if (!w || !w.end) continue;
    const at = w.end - mins * 60000;
    if (at <= now + 30000) continue;
    const accs = orderedAccounts(db).filter(a => a.clan && a.clan.tag === clanTag);
    const left = accs.map(a => ({ a, l: attacksLeft(w, a) })).filter(x => x.l);
    const nt = new Notification();
    nt.identifier = `${WAR_PREFIX}${clanTag}|${w.end}`;
    nt.threadIdentifier = "coc-war";
    nt.title = `${w.type === "friendly" ? "🤝" : "⚔️"} ${warLabel(w)} ends in ${mins >= 60 ? fmtLeft(mins * 60000) : mins + " min"}`;
    nt.body = `${w.ours} vs ${w.theirs} · ★ ${w.oursStars}–${w.theirsStars}` +
      (left.length ? `\nAttacks left (at last check): ${left.map(x => `${x.a.name} ${x.l}`).join(", ")}` : "");
    nt.sound = "alert";
    nt.openURL = CLASH_URL;
    nt.setTriggerDate(new Date(at));
    await nt.schedule();
    n++;
  }
  return n;
}

// Footer strip on an account widget: "⚔️ CWL War: Ours vs Theirs" + countdown.
function warFooter(w, acc, war, now, family) {
  if (!war) return null;
  const prep = war.state === "preparation" && war.start > now;
  const box = w.addStack();
  box.layoutHorizontally(); box.centerAlignContent();
  box.size = new Size(0, 32);      // full width comes from the flexible spacer below
  box.cornerRadius = 10;
  box.setPadding(0, 10, 0, 10);
  box.backgroundColor = TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.1) : TH.track;
  box.url = CLASH_URL;
  shade(t2(box, war.type === "friendly" ? "🤝" : "⚔️", 13)); box.addSpacer(6);
  const left = box.addStack(); left.layoutVertically();
  const l1 = left.addStack(); l1.layoutHorizontally();
  shade(t2(l1, `${warLabel(war)}${prep ? " · prep day" : ""}`, 8.5, TH.accent, "heavy"));
  const al = attacksLeft(war, acc);
  if (al !== null && !prep) { l1.addSpacer(5); shade(t2(l1, al ? `${al} attack${al > 1 ? "s" : ""} left` : "attacks done ✓", 8.5, al ? TH.idle : TH.free, "heavy")); }
  const vs = t2(left, `${war.ours} vs ${war.theirs}`, 11, TH.text, "bold");
  vs.minimumScaleFactor = 0.55; shade(vs); // long clan names shrink instead of crowding the timer
  box.addSpacer(); // flexible: stretches the strip to the full widget width
  // Right column: fixed width, everything flush right.
  const right = box.addStack(); right.layoutVertically(); right.size = new Size(100, 0);
  const r1 = right.addStack(); r1.layoutHorizontally(); r1.addSpacer();
  shade(t2(r1, prep ? "starts in" : `★ ${war.oursStars}–${war.theirsStars} · ends in`, 8.5, TH.dim, "semibold"));
  const r2 = right.addStack(); r2.layoutHorizontally();
  const target = prep ? war.start : war.end, remain = target - now;
  if (remain >= 864e5) {
    r2.addSpacer();
    shade(t2(r2, fmtLeft(remain), 11, TH.text, "bold"));
    return target - Math.floor(remain / 864e5) * 864e5; // redraw when it drops below a day
  }
  const d = r2.addDate(new Date(target));
  d.applyTimerStyle(); d.font = Font.boldMonospacedSystemFont(11); d.textColor = TH.text;
  d.rightAlignText(); d.lineLimit = 1; d.minimumScaleFactor = 0.7; shade(d);
  return target;
}

// Raid Weekend strip: "🏰 RAID WEEKEND · 4 attacks left · ends in 1d 20h"
const RAID_BOX_H = 24;
function raidFooter(w, acc, r, now) {
  const left = raidAttacksLeft(r, acc);
  const box = w.addStack();
  box.layoutHorizontally(); box.centerAlignContent();
  box.size = new Size(0, RAID_BOX_H);
  box.cornerRadius = 8;
  box.setPadding(0, 10, 0, 10);
  box.backgroundColor = TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.1) : TH.track;
  box.url = CLASH_URL;
  shade(t2(box, "🏰", 11)); box.addSpacer(6);
  shade(t2(box, "RAID WEEKEND", 8.5, TH.accent, "heavy")); box.addSpacer(6);
  shade(t2(box, left ? `${left} attack${left > 1 ? "s" : ""} left` : "attacks done ✓", 9.5, left ? TH.idle : TH.free, "heavy"));
  box.addSpacer();
  shade(t2(box, "ends in ", 8.5, TH.dim, "semibold"));
  const remain = r.end - now;
  if (remain >= 864e5) {
    shade(t2(box, fmtLeft(remain), 10, TH.text, "bold"));
    return r.end - Math.floor(remain / 864e5) * 864e5;
  }
  const d = box.addDate(new Date(r.end));
  d.applyTimerStyle(); d.font = Font.boldMonospacedSystemFont(10); d.textColor = TH.text;
  d.rightAlignText(); d.lineLimit = 1; d.size = new Size(58, 0); shade(d);
  return r.end;
}

async function warSettingsFlow() {
  const opts = [0, 5, 10, 15, 30, 60, 120];
  const cur = loadSettings().warAlert ?? 30;
  const a = new Alert();
  a.title = "War ending alert";
  a.message = `Get a notification before a war or CWL war ends.\nCurrently: ${cur ? cur + " min before" : "off"}`;
  for (const m of opts) a.addAction(m ? (m >= 60 ? `${m / 60} hour${m > 60 ? "s" : ""} before` : `${m} min before`) : "Off");
  a.addAction("Custom…");
  a.addCancelAction("Cancel");
  const i = await a.presentSheet();
  if (i < 0) return;
  let mins = opts[i];
  if (i === opts.length) {
    const t = new Alert(); t.title = "Minutes before the war ends";
    t.addTextField("e.g. 45", String(cur)); t.addAction("Save"); t.addCancelAction("Cancel");
    if ((await t.present()) < 0) return;
    mins = Math.max(0, parseInt(t.textFieldValue(0), 10) || 0);
  }
  const st = loadSettings(); st.warAlert = mins; saveSettings(st);
  await scheduleWarAlerts(loadDB());
}

async function apiKeyFlow() {
  const st = loadSettings();
  const a = new Alert();
  a.title = "Backup API key (optional)";
  a.message = "Only needed if war data can't load.\n\n1. Sign in at developer.clashofclans.com\n2. Create a key and enter this IP address: 45.79.218.79\n3. Copy the key and paste it here.";
  a.addTextField("Paste key", st.apiKey || "");
  a.addAction("Save"); a.addDestructiveAction("Remove key"); a.addCancelAction("Cancel");
  const i = await a.present();
  if (i < 0) return;
  st.apiKey = i === 0 ? a.textFieldValue(0).trim() : "";
  saveSettings(st);
}

async function warTestFlow() {
  const db = loadDB();
  const accs = orderedAccounts(db);
  if (!accs.length) { await info("Nothing to test", "Sync an account first."); return; }
  CK_DOWN_UNTIL = 0; const st0 = loadSettings(); delete st0.ckDownUntil; saveSettings(st0);
  const wars = await refreshWars(accs, true);
  saveDB(db);
  const n = await scheduleWarAlerts(db);
  const nr = await scheduleRaidAlerts(db);
  const ng = await scheduleGamesAlerts(db);
  const t = new UITable(); t.showSeparators = true;
  const h = new UITableRow(); h.isHeader = true; h.height = 60;
  h.addText("War check", `${n} war alert${n === 1 ? "" : "s"}, ${nr} raid alert${nr === 1 ? "" : "s"}, ${ng} Clan Games alert${ng === 1 ? "" : "s"} scheduled · screenshot this for Claude`);
  t.addRow(h);
  for (const a of accs) {
    const r = new UITableRow(); r.height = 108;
    const c = a.clan ? wars[a.clan.tag] : null, w = warFor(a, wars);
    const line = !a.clan ? (a.clanErr ? `Lookup failed: ${a.clanErr}` : "Not in a clan")
      : w ? `${warLabel(w)} · ${w.state} · ${w.ours} vs ${w.theirs} · ends ${fmtClock(w.end)}`
      : `No active war · ${c ? c.note : "not checked"}`;
    const rd = raidFor(a, wars);
    const rline = !a.clan ? "" : rd ? `\n🏰 Raid Weekend · ${raidAttacksLeft(rd, a)} attacks left · ends ${fmtClock(rd.end)}`
      : `\n🏰 No Raid Weekend now${c && c.raidNote ? " · " + c.raidNote : ""}`;
    const gp = gamesPoints(a, Date.now());
    const gline = `\n🎮 Games Champion total ${a.cg ? fmtNum(a.cg.value) : "?"}` + (inGames(Date.now())
      ? ` · Clan Games: ${gp === null ? "points unknown this time" : fmtNum(gp) + " / " + fmtNum(CG_MAX)}${a.cgBase ? " (start from " + a.cgBase.src + ")" : ""}`
      : ` · next Clan Games ${fmtClock(nextGamesStart(Date.now()))}`);
    const cell = r.addText(`${a.name}${a.clan ? "  ·  " + a.clan.name : ""}`, line + rline + gline);
    cell.subtitleFont = Font.systemFont(11);
    t.addRow(r);
  }
  await t.present(false);
}

// ───────────────────────────── Boosts & helpers ────────────────────────────
// The export stores each upgrade's work left at normal speed ("timer", seconds) and
// the boosts running at export time ("boosts": seconds left). Finish times are worked
// out here by simulating the speed over time.
//
// Speeds stack by adding their extra: Builder Potion 10x (+9), Builder Bite 2x (+1)
// → 11x together. Research Potion 24x (+23), Study Soup 4x (+3) → 27x. Pet Potion 24x.
// Builder's Apprentice / Lab Assistant at level N add +N while their 1-hour session
// runs, and potions don't speed them up.
const BOOST_TYPES = {
  builderPotion: { name: "Builder Potion", cat: "builder", extra: 9, emoji: "🧪", short: "Potion" },
  builderBite:   { name: "Builder Bite",   cat: "builder", extra: 1, emoji: "🍖", short: "Bite" },
  researchPotion:{ name: "Research Potion", cat: "lab",    extra: 23, emoji: "⚗️", short: "Potion" },
  studySoup:     { name: "Study Soup",     cat: "lab",     extra: 3, emoji: "🍲", short: "Soup", cats: ["lab", "pets"] },
  petPotion:     { name: "Pet Potion",     cat: "pets",    extra: 23, emoji: "🐾", short: "Potion" },
};
// The upgrade lists a boost speeds up (Study Soup: Laboratory and Pet House).
const boostCats = (T) => (T && (T.cats || [T.cat])) || [];
const BOOST_ORDER = ["builderPotion", "builderBite", "researchPotion", "studySoup", "petPotion"];

// Real potion / snack pictures from ClashKing's asset library (cached on the phone).
const BOOST_ICON_PATHS = {
  builderPotion: ["magic_items/builder_potion.webp", "magic_items/builder_potion.png"],
  researchPotion: ["magic_items/research_potion.webp", "magic_items/research_potion.png"],
  petPotion: ["magic_items/pet_potion.webp", "magic_items/pet_potion.png"],
  builderBite: ["magic_items/builder_bite.webp", "magic_snacks/builder_bite.webp", "snacks/builder_bite.webp", "magic_items/snacks/builder_bite.webp"],
  studySoup: ["magic_items/study_soup.webp", "magic_snacks/study_soup.webp", "snacks/study_soup.webp", "magic_items/snacks/study_soup.webp"],
};
function boostIconPath(kind) { return fm.joinPath(ICON_DIR, `boost_${kind}.png`); }
function getBoostIcon(kind) {
  try { const p = boostIconPath(kind); if (fm.fileExists(p)) return Image.fromFile(p); } catch (e) { }
  return null;
}
async function ensureBoostIcons(force) {
  const report = [];
  for (const kind of BOOST_ORDER) {
    const key = `boost_${kind}`, entry = ICON_INDEX[key];
    if (!force && fm.fileExists(boostIconPath(kind))) { report.push({ kind, ok: true, url: entry && entry.url }); continue; }
    if (!force && entry && entry.fail && Date.now() - entry.fail < 3 * 864e5) { report.push({ kind, ok: false }); continue; }
    let ok = false;
    for (const rel of BOOST_ICON_PATHS[kind]) {
      try {
        const req = new Request(ICON_BASE + rel); req.timeoutInterval = 5;
        const data = await req.load();
        const code = req.response && req.response.statusCode;
        if (code && code !== 200) continue;
        const img = Image.fromData(data);
        if (!img || !img.size || img.size.width < 4) continue;
        const dc = new DrawContext(); dc.size = new Size(64, 64); dc.opaque = false; dc.respectScreenScale = false;
        const sc = Math.min(64 / img.size.width, 64 / img.size.height), w = img.size.width * sc, h = img.size.height * sc;
        dc.drawImageInRect(img, new Rect((64 - w) / 2, (64 - h) / 2, w, h));
        fm.writeImage(boostIconPath(kind), dc.getImage());
        ICON_INDEX[key] = { url: ICON_BASE + rel }; ok = true;
        report.push({ kind, ok: true, url: ICON_BASE + rel });
        break;
      } catch (e) { }
    }
    if (!ok) { ICON_INDEX[key] = { fail: Date.now() }; report.push({ kind, ok: false }); }
  }
  saveIconIndex();
  return report;
}
// Helper pictures for the widget strip (cached on the phone like the potions).
const HELPER_ICON_PATHS = {
  apprentice: ["helpers/builder's_apprentice.webp", "helpers/builder_s_apprentice/portrait.webp"],
  assistant: ["helpers/lab_assistant.webp"],
  alchemist: ["helpers/alchemist.webp"],
  prospector: ["helpers/prospector.webp"],
};
function helperIconPath(key) { return fm.joinPath(ICON_DIR, `helper_${key}.png`); }
function getHelperIcon(key) {
  try { const p = helperIconPath(key); if (fm.fileExists(p)) return Image.fromFile(p); } catch (e) { }
  return null;
}
async function ensureHelperIcons(force) {
  const report = [];
  for (const [key, rels] of Object.entries(HELPER_ICON_PATHS)) {
    const ik = `helper_${key}`, entry = ICON_INDEX[ik];
    if (!force && fm.fileExists(helperIconPath(key))) { report.push({ key, ok: true, url: entry && entry.url }); continue; }
    if (!force && entry && entry.fail && Date.now() - entry.fail < 3 * 864e5) { report.push({ key, ok: false }); continue; }
    let ok = false;
    for (const rel of rels) {
      try {
        const url = ICON_BASE + encodeURI(rel);
        const req = new Request(url); req.timeoutInterval = 5;
        const data = await req.load();
        const code = req.response && req.response.statusCode;
        if (code && code !== 200) continue;
        const img = Image.fromData(data);
        if (!img || !img.size || img.size.width < 4) continue;
        const dc = new DrawContext(); dc.size = new Size(48, 48); dc.opaque = false; dc.respectScreenScale = false;
        const sc = Math.min(48 / img.size.width, 48 / img.size.height), w = img.size.width * sc, h = img.size.height * sc;
        dc.drawImageInRect(img, new Rect((48 - w) / 2, (48 - h) / 2, w, h));
        fm.writeImage(helperIconPath(key), dc.getImage());
        ICON_INDEX[ik] = { url }; ok = true;
        report.push({ key, ok: true, url });
        break;
      } catch (e) { }
    }
    if (!ok) { ICON_INDEX[ik] = { fail: Date.now() }; report.push({ key, ok: false }); }
  }
  saveIconIndex();
  return report;
}
const HELPER_IDS = { 93000000: "apprentice", 93000001: "assistant", 93000002: "alchemist", 93000003: "prospector" };

// Which boost a key in the export's "boosts" object is.
function boostKind(key) {
  const k = key.toLowerCase();
  if (/bite/.test(k) || /builder.*(snack|consum|food)/.test(k)) return "builderBite";
  if (/soup/.test(k) || /(lab|research).*(snack|consum|food)/.test(k)) return "studySoup";
  if (/^builder_?boost$/.test(k) || /builder.*potion/.test(k)) return "builderPotion";
  if (/^lab_?boost$/.test(k) || /(research|lab).*potion/.test(k)) return "researchPotion";
  if (/^pets?_?boost$/.test(k) || /pet.*potion/.test(k)) return "petPotion";
  return null;
}

// The boost "channel" an upgrade belongs to (gear-ups in the Home Village use builders).
function boostCat(it) {
  if (it.cat === "builder") return "builder";
  if (it.gear && it.src === "buildings") return "builder";
  if (it.cat === "lab") return "lab";
  if (it.cat === "pets") return "pets";
  return null;
}

function allBoosts(acc) { return (acc.boostsExport || []).concat(acc.manualBoosts || []); }
function activeBoosts(acc, cat, now) {
  return allBoosts(acc).filter(b => BOOST_TYPES[b.kind] && boostCats(BOOST_TYPES[b.kind]).includes(cat) && b.to > now)
    .sort((a, b) => a.to - b.to);
}

function helperLevel(acc, it) {
  const h = acc.helpers || {};
  const c = boostCat(it);
  if (c === "builder") return (h.apprentice && h.apprentice.lvl) || 0;
  if (c === "lab") return (h.assistant && h.assistant.lvl) || 0;
  return 0;
}

// Speed-up periods for one upgrade since the export: potions, snacks and helpers.
function boostIntervals(acc, it) {
  const t0 = acc.exportTs;
  const cat = boostCat(it);
  const iv = [];
  if (cat) for (const b of allBoosts(acc)) {
    const T = BOOST_TYPES[b.kind];
    if (!T || !boostCats(T).includes(cat)) continue;
    const from = Math.max(b.from, t0), to = b.to;
    if (to > from) iv.push({ from, to, extra: T.extra });
  }
  const lvl = helperLevel(acc, it);
  if (it.helperEnd && lvl && it.helperEnd > t0) iv.push({ from: t0, to: it.helperEnd, extra: lvl });
  return iv;
}

// Finish time for one upgrade, given its unboosted work left at export time.
function boostedEnd(acc, it) {
  if (!it.raw || !acc.exportTs) return it.end;
  const t0 = acc.exportTs;
  const iv = boostIntervals(acc, it);
  let work = it.raw * 1000, t = t0;
  const marks = [...new Set(iv.flatMap(x => [x.from, x.to]).filter(x => x > t0))].sort((a, b) => a - b);
  for (const next of marks.concat([Infinity])) {
    const speed = 1 + iv.filter(x => x.from <= t && x.to > t).reduce((s, x) => s + x.extra, 0);
    const span = next - t;
    if (work <= speed * span) return Math.round(t + work / speed);
    work -= speed * span;
    t = next;
  }
  return it.end;
}

// Work left (ms at normal speed) at time `now`, after any speed-ups since the export.
function workLeftAt(acc, it, now) {
  if (!acc || !it.raw || !acc.exportTs) return Math.max(0, it.end - now);
  const t0 = acc.exportTs;
  let work = it.raw * 1000;
  if (now <= t0) return work;
  const iv = boostIntervals(acc, it);
  const marks = [...new Set(iv.flatMap(x => [x.from, x.to]).filter(x => x > t0 && x < now))].sort((a, b) => a - b);
  let t = t0;
  for (const next of marks.concat([now])) {
    const speed = 1 + iv.filter(x => x.from <= t && x.to > t).reduce((s, x) => s + x.extra, 0);
    work -= speed * (next - t);
    t = next;
    if (work <= 0) return 0;
  }
  return work;
}

function recomputeEnds(acc) {
  for (const it of acc.items || []) {
    if (!it.raw) continue;
    it.rawEnd = acc.exportTs + it.raw * 1000;
    it.end = boostedEnd(acc, it);
  }
  (acc.items || []).sort((a, b) => a.end - b.end);
}

function fmtShort(ms) { return fmtLeft(ms).split(" ").slice(0, 2).join(" "); }

// ── Builder Base Clock Tower ──
function clockStatus(acc, now) {
  const c = acc.clock;
  if (!c) return null;
  if (c.boostEnd && c.boostEnd > now) return { state: "boosting", until: c.boostEnd };
  if (c.readyAt && c.readyAt > now) return { state: "recharging", until: c.readyAt };
  return { state: "ready", until: 0 };
}
function clockItem(acc) { const l = (acc.clock && acc.clock.lvl) || 1; return { id: CLOCK_TOWER, lvl: l - 1, to: l, cat: "bb" }; }
// "line": "Clock Tower ready to boost" · "Clock Tower boosting · 18m left" · "Clock Tower ready in 5h 20m"
// "short": "ready" · "18m" · "in 5h"
function clockText(st, mode, now) {
  const left = st.until ? fmtShort(st.until - now) : "";
  if (st.state === "ready") return { text: mode === "line" ? "Clock Tower ready to boost" : "ready", color: TH.free };
  if (st.state === "boosting") return { text: mode === "line" ? `Clock Tower boosting · ${left} left` : left, color: TH.accent };
  return { text: mode === "line" ? `Clock Tower ready in ${left}` : `in ${left}`, color: TH.dim };
}
function drawClock(stack, acc, st, mode, now, icon) {
  const img = getIcon(clockItem(acc));
  if (img) { const im = stack.addImage(img); im.imageSize = new Size(icon, icon); stack.addSpacer(3); }
  else shade(t2(stack, "⏰ ", mode === "line" ? 9 : 8.5, TH.dim, "semibold"));
  const t = clockText(st, mode, now);
  shade(t2(stack, t.text, mode === "line" ? 9 : 8.5, t.color, "semibold"));
  return st.until ? [st.until] : [];
}

// Status of each helper for the widget strip: working (on what, for how long), resting
// (back in …), or ready. The Prospector only for Gold Pass holders.
function helperStatus(acc, now) {
  const h = acc.helpers || {}, out = [];
  for (const key of HELPER_ORDER) {
    const x = h[key];
    if (!x || !HELPERS[key]) continue;
    if (key === "prospector" && !hasGoldPass(acc, now)) continue;
    let item = null, working = 0;
    if (HELPERS[key].cat) {
      item = (acc.items || []).find(i => boostCat(i) === HELPERS[key].cat && i.helperAssigned && i.end > now) || null;
      if (item && item.helperEnd && item.helperEnd > now) working = item.helperEnd;
    }
    const cd = x.cooldownEnd && x.cooldownEnd > now ? x.cooldownEnd : 0;
    out.push(working ? { key, state: "working", until: working, item }
      : cd ? { key, state: "resting", until: cd, item }
      : { key, state: "ready", until: 0, item: null });
  }
  return out;
}
// "full": "X-Bow 32m" · "X-Bow in 14h" · "back in 5h" · "ready";  "compact": "32m" · "14h" · "✓"
function helperChip(c, mode, now) {
  if (c.key === "games") return gamesText(c.pts, mode === "full" ? "full" : "compact");
  if (c.key === "raid") {
    if (!c.left) return { text: mode === "full" ? "Raid done ✓" : "✓", color: TH.free };
    return { text: mode === "full" ? `Raid ${c.left} left` : `${c.left}`, color: TH.idle };
  }
  if (c.key === "clock") {
    const t = clockText(c.st, mode === "full" ? "short" : "short", now);
    if (mode === "full") return { text: c.st.state === "ready" ? "ready to boost" : c.st.state === "boosting" ? `boosting ${t.text}` : `ready ${t.text}`, color: t.color };
    return { text: c.st.state === "ready" ? "✓" : t.text.replace(/^in /, ""), color: t.color };
  }
  const left = c.until ? fmtShort(c.until - now) : "";
  if (c.state === "ready") return { text: mode === "full" ? "ready" : "✓", color: TH.free };
  if (mode === "compact") return { text: left, color: c.state === "working" ? TH.accent : TH.dim };
  if (c.state === "working") return { text: `${itemName(c.item)} ${left}`, color: TH.accent };
  return { text: c.item ? `${itemName(c.item)} in ${left}` : `back in ${left}`, color: TH.dim };
}
const HS_FONT = 8.5, HS_ICON = 13, HS_GAP = 10, HS_LINE = 14;
// Split the chips into lines that fit `width` (estimated text widths).
function stripLines(list, mode, width, now) {
  const est = (c) => HS_ICON + 3 + helperChip(c, mode, now).text.length * HS_FONT * 0.56;
  const lines = [];
  let cur = [], w = 0;
  for (const c of list) {
    const cw = est(c);
    if (cur.length && w + HS_GAP + cw > width) { lines.push(cur); cur = []; w = 0; }
    w += (cur.length ? HS_GAP : 0) + cw; cur.push(c);
  }
  if (cur.length) lines.push(cur);
  return lines;
}
function stripHeight(lines) { return lines.length ? lines.length * HS_LINE + (lines.length - 1) * 3 : 0; }
function drawHelperChips(r, line, mode, now, gap = HS_GAP, icon = HS_ICON) {
  const redraws = [];
  line.forEach((c, i) => {
    if (i) r.addSpacer(gap);
    const img = c.key === "raid" || c.key === "games" ? null : c.key === "clock" ? getIcon(clockItem(c.acc)) : getHelperIcon(c.key);
    if (img) { const im = r.addImage(img); im.imageSize = new Size(icon, icon); r.addSpacer(2); }
    else shade(t2(r, (c.key === "games" ? "🎮" : c.key === "raid" ? "🏰" : c.key === "clock" ? "⏰" : HELPERS[c.key].emoji) + " ", HS_FONT, TH.dim, "semibold"));
    const ch = helperChip(c, mode, now);
    shade(t2(r, ch.text, HS_FONT, ch.color, "semibold"));
    if (c.until) redraws.push(c.until);
  });
  return redraws;
}
function drawHelperStrip(w, list, mode, width, now) {
  const redraws = [];
  stripLines(list, mode, width, now).forEach((line, li) => {
    if (li) w.addSpacer(3);
    const r = w.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.url = CLASH_URL;
    redraws.push(...drawHelperChips(r, line, mode, now));
    r.addSpacer();
  });
  return redraws;
}

// Goblin Builder / Researcher: more upgrades running than regular builders / one lab.
function goblinCounts(acc, now) {
  const total = builderCount(acc) || 0;
  const busy = activeAt(acc, "builder", now).length;
  const labs = activeAt(acc, "lab", now).length;
  return { builder: total ? Math.max(0, busy - total) : 0, lab: Math.max(0, labs - 1) };
}

// Small pill in a section header: running boost (or a "+" to add one).
function boostPills(parent, acc, secKey, now, redraws) {
  const cat = secKey === "builder" ? "builder" : secKey === "lab" ? "lab" : secKey === "pets" ? "pets" : null;
  if (!cat) return;
  const act = activeBoosts(acc, cat, now);
  const mk = (txt, url, strong, kind) => {
    const p = parent.addStack(); p.layoutHorizontally(); p.centerAlignContent();
    p.setPadding(1, kind ? 4 : 6, 1, 6); p.cornerRadius = 7;
    p.backgroundColor = strong ? new Color(TH.accent.hex, 0.22) : (TH.track.alpha < 0.2 ? new Color(TH.track.hex, 0.12) : TH.track);
    p.url = url;
    const img = kind ? getBoostIcon(kind) : null;
    if (img) { const im = p.addImage(img); im.imageSize = new Size(13, 13); p.addSpacer(3); }
    else if (kind) txt = `${BOOST_TYPES[kind].emoji} ${txt}`;
    shade(t2(p, txt, 8.5, strong ? TH.accent : TH.dim, "heavy"));
    parent.addSpacer(4);
  };
  const base = URLScheme.forRunningScript();
  if (act.length) {
    for (const b of act) {
      const T = BOOST_TYPES[b.kind];
      mk(`${T.short} ${fmtShort(b.to - now)}`, `${base}?action=boosts`, true, b.kind);
      redraws.push(b.to);
    }
  } else {
    mk("+ boost", `${base}?action=addboost&tag=${encodeURIComponent(acc.tag)}&cat=${cat}`, false);
  }
}

// ── Tap an upgrade → details pop-up ──
function detailURL(acc, it) {
  return `${URLScheme.forRunningScript()}?action=detail&tag=${encodeURIComponent(acc.tag)}&uid=${encodeURIComponent(it.uid || "")}`;
}

function fmtDate(ts) {
  const df = new DateFormatter(); df.dateFormat = "EEE d MMM, HH:mm"; return df.string(new Date(ts));
}
function fmtHMS(ms) {
  if (ms <= 0) return "done";
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  const hms = `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
  return d ? `${d}d ${hms}` : hms;
}

async function detailFlow(tag, uid) {
  const db = loadDB();
  const acc = db.accounts[tag];
  const it = acc && (acc.items || []).find(i => i.uid === uid);
  if (!it) { await info("Not found", "This upgrade isn't in the latest sync any more."); return; }
  const now = Date.now(), cat = boostCat(it);
  const typeName = { builder: "Builder", lab: "Laboratory", pets: "Pet House", bb: it.gear ? "Gear Up (Master Builder)" : "Builder Base", starlab: "Star Laboratory", other: "Upgrade" }[it.cat] || "Upgrade";
  const boosts = cat ? activeBoosts(acc, cat, now) : [];
  const lines = [
    `Time left: ${fmtHMS(it.end - now)}`,
    `Finishes: ${fmtDate(it.end)}`,
    `Progress: ${Math.floor(progressOf(it, now, acc) * 100)}% of ${fmtShort(it.dur || 0)}${it.durKnown ? "" : " (counted from first sync)"}`,
    `Type: ${typeName}${it.goblin ? " · Goblin" : ""}`,
    `Boost: ${boosts.length ? boosts.map(b => `${BOOST_TYPES[b.kind].name} (${fmtShort(b.to - now)} left)`).join(", ") : "none running"}`,
  ];
  if (it.helperAssigned) {
    const who = cat === "lab" ? "Lab Assistant" : "Builder's Apprentice";
    lines.push(`${who}: ${it.helperEnd && it.helperEnd > now ? `working, ${fmtShort(it.helperEnd - now)} left` : "assigned"}`);
  }
  if (it.rawEnd && Math.abs(it.rawEnd - it.end) > 60000) lines.push(`Without boosts: ${fmtDate(it.rawEnd)}`);
  lines.push(`Data from export: ${fmtDate(acc.lastExport)}`);
  const a = new Alert();
  a.title = `${itemName(it)} → ${it.to}`;
  a.message = lines.join("\n");
  a.addAction("Open Clash");
  a.addAction("All timers");
  a.addCancelAction("Close");
  const i = await a.present();
  if (i === 0) Safari.open(CLASH_URL);
  if (i === 1) await viewFlow();
}

// ── Menu: add / view boosts ──
async function addBoostFlow(tagPre, catPre) {
  const db = loadDB();
  let acc = tagPre ? db.accounts[tagPre] : null;
  if (!acc) acc = await pickAccount(db, "Add a boost to which account?");
  if (!acc) return;
  const kinds = BOOST_ORDER.filter(k => !catPre || boostCats(BOOST_TYPES[k]).includes(catPre));
  const a = new Alert(); a.title = `Add boost · ${acc.name}`;
  a.message = "Use this for a potion or snack you started after your last export.";
  for (const k of kinds) a.addAction(`${BOOST_TYPES[k].emoji} ${BOOST_TYPES[k].name}`);
  a.addCancelAction("Cancel");
  const ki = await a.presentSheet(); if (ki < 0) return;
  const kind = kinds[ki];
  const n = new Alert(); n.title = `How many ${BOOST_TYPES[kind].name}s?`;
  n.message = "Using more than one makes it last longer (1 hour each), not faster.";
  for (const c of [1, 2, 3, 4, 5]) n.addAction(String(c));
  n.addCancelAction("Cancel");
  const ci = await n.presentSheet(); if (ci < 0) return;
  const w = new Alert(); w.title = "When did you start it?";
  const ago = [0, 5, 10, 15, 30, 45];
  for (const m of ago) w.addAction(m ? `${m} min ago` : "Just now");
  w.addAction("Custom…"); w.addCancelAction("Cancel");
  const wi = await w.presentSheet(); if (wi < 0) return;
  let mins = ago[wi];
  if (wi === ago.length) {
    const t = new Alert(); t.title = "Started how many minutes ago?"; t.addTextField("e.g. 20", "0");
    t.addAction("Save"); t.addCancelAction("Cancel");
    if ((await t.present()) < 0) return;
    mins = Math.max(0, parseInt(t.textFieldValue(0), 10) || 0);
  }
  const from = Date.now() - mins * 60000;
  const a2 = db.accounts[acc.tag];
  a2.manualBoosts = (a2.manualBoosts || []).filter(b => b.to > Date.now());
  a2.manualBoosts.push({ kind, from, to: from + (ci + 1) * 3600e3, manual: true });
  recomputeEnds(a2);
  saveDB(db);
  await rescheduleAll(db);
  await info("Boost added", `${BOOST_TYPES[kind].name} on ${a2.name}: timers and alerts updated.`);
}

async function boostsFlow() {
  while (true) {
    const db = loadDB(), now = Date.now();
    const rows = [];
    for (const acc of orderedAccounts(db))
      for (const b of allBoosts(acc)) if (b.to > now && BOOST_TYPES[b.kind]) rows.push({ acc, b });
    const t = new UITable(); t.showSeparators = true;
    const h = new UITableRow(); h.isHeader = true; h.height = 60;
    h.addText("Active boosts", rows.length ? "Tap one you added by hand to remove it" : "Nothing running right now");
    t.addRow(h);
    let removed = false;
    for (const { acc, b } of rows) {
      const r = new UITableRow(); r.height = 56;
      const T = BOOST_TYPES[b.kind];
      const bi = getBoostIcon(b.kind);
      if (bi) { const c = r.addImage(bi); c.widthWeight = 12; }
      const tc = r.addText(`${bi ? "" : T.emoji + " "}${T.name} · ${acc.name}`, `${fmtShort(b.to - now)} left · ${b.manual ? "added by you" : "from export"}`);
      tc.widthWeight = 88;
      if (b.manual) {
        r.dismissOnSelect = true;
        r.onSelect = () => {
          const a = db.accounts[acc.tag];
          a.manualBoosts = (a.manualBoosts || []).filter(x => x !== b && !(x.kind === b.kind && x.from === b.from));
          recomputeEnds(a); saveDB(db); removed = true;
        };
      }
      t.addRow(r);
    }
    const add = new UITableRow(); add.height = 50;
    add.addText("＋ Add a boost").titleColor = new Color("#0a84ff");
    add.dismissOnSelect = true;
    let wantAdd = false;
    add.onSelect = () => { wantAdd = true; };
    t.addRow(add);
    await t.present(false);
    if (removed) { await rescheduleAll(loadDB()); continue; }
    if (wantAdd) { await addBoostFlow(); continue; }
    return;
  }
}

// ──────────────────────────────── In-app UI ────────────────────────────────

async function pickAccount(db, title) {
  const accs = orderedAccounts(db);
  if (!accs.length) { await info("No accounts yet", "Copy a Data Export in Clash first."); return null; }
  const a = new Alert(); a.title = title;
  for (const acc of accs) a.addAction(`${acc.name}  (TH${acc.th || "?"} ${acc.tag})`);
  a.addCancelAction("Cancel");
  const i = await a.presentSheet();
  return i < 0 ? null : accs[i];
}

async function info(title, msg) {
  const a = new Alert(); a.title = title; a.message = msg || ""; a.addAction("OK");
  await a.present();
}

async function renameFlow() {
  const db = loadDB();
  const acc = await pickAccount(db, "Rename which account?");
  if (!acc) return;
  const a = new Alert(); a.title = `Name for ${acc.tag}`; a.message = `Currently: ${acc.name}`;
  const used = new Set(Object.values(db.accounts).map(x => x.name));
  const opts = NAME_SUGGESTIONS.filter(n => !used.has(n));
  for (const n of opts) a.addAction(n);
  a.addAction("Type a name…");
  a.addCancelAction("Cancel");
  const i = await a.presentSheet();
  if (i < 0) return;
  let name = opts[i];
  if (i === opts.length) {
    const t = new Alert(); t.title = "Account name";
    t.addTextField("Name", acc.name); t.addAction("Save"); t.addCancelAction("Cancel");
    if ((await t.present()) < 0) return;
    name = t.textFieldValue(0).trim();
  }
  if (!name) return;
  db.accounts[acc.tag].name = name;
  saveDB(db);
  await rescheduleAll(db);
  await info("Renamed", `${acc.tag} is now “${name}”.`);
}

async function buildersFlow() {
  const db = loadDB();
  const acc = await pickAccount(db, "Set builder count for…");
  if (!acc) return;
  const t = new Alert();
  t.title = `Builders on ${acc.name}`;
  t.message = `Detected ${acc.huts || "?"} Builder's Huts. If you also have the 6th builder (B.O.B), enter your real total. Leave empty to use the detected count.`;
  t.addTextField("e.g. 6", acc.builders ? String(acc.builders) : "");
  t.addAction("Save"); t.addCancelAction("Cancel");
  if ((await t.present()) < 0) return;
  const v = parseInt(t.textFieldValue(0), 10);
  db.accounts[acc.tag].builders = v > 0 ? v : null;
  saveDB(db);
  await rescheduleAll(db);
}

async function removeFlow() {
  const db = loadDB();
  const acc = await pickAccount(db, "Remove which account?");
  if (!acc) return;
  const c = new Alert(); c.title = `Remove ${acc.name}?`;
  c.message = "Its upgrades and alerts will be deleted. Importing its export again adds it back.";
  c.addDestructiveAction("Remove"); c.addCancelAction("Cancel");
  if ((await c.present()) < 0) return;
  delete db.accounts[acc.tag];
  saveDB(db);
  await rescheduleAll(db);
}

async function viewFlow() {
  const db = loadDB();
  const now = Date.now();
  const table = new UITable();
  table.showSeparators = true;
  const accs = orderedAccounts(db);
  if (!accs.length) {
    const r = new UITableRow(); r.addText("No accounts yet", "Copy a Data Export in Clash, then run this script.");
    r.height = 70; table.addRow(r);
  }
  for (const a of accs) {
    const h = new UITableRow();
    h.isHeader = true; h.height = 64;
    h.backgroundColor = new Color("#1d2740");
    const hc = h.addText(`${a.name}  ·  TH${a.th || "?"}`, `${summaryLine(a, now)}\nExported ${fmtAgo(a.lastExport)}`);
    hc.titleColor = new Color("#e3b341"); hc.subtitleColor = Color.white();
    hc.titleFont = Font.boldSystemFont(16); hc.subtitleFont = Font.systemFont(12);
    table.addRow(h);
    const active = (a.items || []).filter(i => i.end > now);
    if (!active.length) {
      const r = new UITableRow(); r.addText("Nothing upgrading").titleColor = new Color("#f0883e"); table.addRow(r);
    }
    for (const it of active) {
      const r = new UITableRow(); r.height = 52;
      const left = r.addText(`${CAT[it.cat].emoji}  ${itemLabel(it)}`);
      left.widthWeight = 65; left.titleFont = Font.systemFont(14);
      const right = r.addText(fmtLeft(it.end - now), fmtClock(it.end));
      right.widthWeight = 35; right.rightAligned();
      right.titleFont = Font.semiboldSystemFont(14); right.subtitleFont = Font.systemFont(11);
      table.addRow(r);
    }
  }
  await table.present(false);
}

async function themeFlow() {
  const a = new Alert();
  a.title = "Default theme";
  a.message = "Used by every widget without its own theme.\nTo give one widget a different theme, add it to the widget's Parameter, e.g.  2, clash";
  for (const k of THEME_ORDER) a.addAction(THEMES[k].name);
  a.addCancelAction("Cancel");
  const i = await a.presentSheet();
  if (i < 0) return;
  const st = loadSettings(); st.theme = THEME_ORDER[i]; saveSettings(st);
  const db = loadDB();
  const acc = orderedAccounts(db)[0];
  await buildWidget(db, "large", acc ? acc.tag : null).presentLarge();
}

async function progressFlow() {
  const a = new Alert();
  a.title = "Progress style";
  a.message = "Used by every account widget without its own style.\nTo give one widget a different style, add it to the widget's Parameter, e.g.  2, rings";
  for (const k of PROG_ORDER) a.addAction(PROGRESS[k]);
  a.addCancelAction("Cancel");
  const i = await a.presentSheet();
  if (i < 0) return;
  const st = loadSettings(); st.progress = PROG_ORDER[i]; saveSettings(st);
  const db = loadDB();
  const acc = orderedAccounts(db)[0];
  await buildWidget(db, "large", acc ? acc.tag : null).presentLarge();
}

async function iconTestFlow() {
  const db = loadDB();
  await refreshRemoteNames().catch(() => {});
  const items = [];
  const seen = new Set();
  for (const a of orderedAccounts(db)) for (const it of a.items || []) {
    if (seen.has(iconKey(it))) continue; seen.add(iconKey(it)); items.push(it);
  }
  if (!items.length) { await info("Nothing to test", "Sync an account first."); return; }
  const report = await ensureIcons(items, 200, true);
  const boostRep = await ensureBoostIcons(true);
  await ensureHelperIcons(true);
  const okN = report.filter(r => r.ok).length;
  const t = new UITable(); t.showSeparators = true;
  const h = new UITableRow(); h.isHeader = true; h.height = 60;
  h.addText(`Icons: ${okN} of ${report.length} found · potions & snacks: ${boostRep.filter(r => r.ok).length} of ${boostRep.length}`, "Screenshot this and send it to Claude");
  t.addRow(h);
  for (const r of boostRep) {
    const row = new UITableRow(); row.height = 56;
    const img = r.ok ? getBoostIcon(r.kind) : null;
    if (img) { const c = row.addImage(img); c.widthWeight = 12; }
    else { const c = row.addText("✕"); c.widthWeight = 12; c.titleColor = new Color("#f85149"); }
    const c2 = row.addText(BOOST_TYPES[r.kind].name, r.ok ? (r.url || "").replace(ICON_BASE, "") : "not found — emoji used instead");
    c2.widthWeight = 88; c2.subtitleFont = Font.systemFont(10);
    t.addRow(row);
  }
  for (const r of report) {
    const row = new UITableRow(); row.height = r.ok ? 56 : 92;
    const img = r.ok ? getIcon(r.it) : null;
    if (img) { const c = row.addImage(img); c.widthWeight = 12; }
    else { const c = row.addText("✕"); c.widthWeight = 12; c.titleColor = new Color("#f85149"); }
    const c2 = row.addText(itemName(r.it) + (isBuildingLike(r.it) ? ` (lv ${r.it.to})` : ""),
      r.ok ? (r.url || "").replace(ICON_BASE, "")
           : `not found · id ${r.it.id} · ${REMOTE_SECT[r.it.id] || "no category"} · tried ${(r.tried || []).length}: ${(r.tried || []).slice(0, 3).join(", ")}`);
    c2.widthWeight = 88; c2.subtitleFont = Font.systemFont(10);
    t.addRow(row);
  }
  await t.present(false);
}

async function menu(importMsg) {
  while (true) {
    const db = loadDB();
    const n = Object.keys(db.accounts).length;
    const a = new Alert();
    a.title = "CoC Upgrade Tracker";
    a.message = (importMsg ? importMsg + "\n\n" : "") + `${n} account${n === 1 ? "" : "s"} tracked.`;
    importMsg = null;
    const actions = [
      ["📋 View all upgrades", viewFlow],
      ["📈 Progress to max", maxProgressFlow],
      ...(inGames(Date.now()) ? [["🎮 Set Clan Games points", gamesSetFlow]] : []),
      ["⚗️ Add a boost (potion / snack)", () => addBoostFlow()],
      ["⏱️ Active boosts", boostsFlow],
      ["✏️ Rename an account", renameFlow],
      ["🔨 Set builder count", buildersFlow],
      ["🖼️ Preview widget", async () => {
        const db = loadDB();
        const acc = await pickAccount(db, "Preview which widget?");
        if (acc) await buildWidget(db, "large", acc.tag).presentLarge();
      }],
      ["🖼️ Preview overview widget", async () => { await buildWidget(loadDB(), "large").presentLarge(); }],
      [`🎨 Theme: ${THEMES[loadSettings().theme || "elixir"].name}`, themeFlow],
      [`📊 Progress style: ${PROGRESS[loadSettings().progress] ? PROGRESS[loadSettings().progress] : PROGRESS.bars}`, progressFlow],
      [`⏳ Time reduction: ${cutLabel()}`, timeCutFlow],
      [`⚔️ War alert: ${(loadSettings().warAlert ?? 30) ? (loadSettings().warAlert ?? 30) + " min before end" : "off"}`, warSettingsFlow],
      [`🏰 Raid Weekend alert: ${raidAlertHours() ? raidAlertHours() + "h before end" : "off"}`, raidSettingsFlow],
      [`🎮 Clan Games alerts: ${gamesAlertHours() ? gamesAlertHours() + "h before end" : "off"}`, gamesSettingsFlow],
      [`😴 Sleep alerts: ${sleepLabel()}`, sleepFlow],
      ["🧪 Test war data", warTestFlow],
      [`🔑 Backup API key: ${(loadSettings().apiKey || "").trim() ? "added" : "none"}`, apiKeyFlow],
      ["🧪 Test icons (ClashKing)", iconTestFlow],
      [`🔔 Ready alerts (helpers, Clock Tower): ${helperAlertsLabel()}`, helperAlertsFlow],
      ["🔔 Send a test notification", async () => { await notifyNow("CoC Tracker", "Notifications are working ✅"); }],
      ["🗑️ Remove an account", removeFlow],
    ];
    for (const [label] of actions) a.addAction(label);
    a.addCancelAction("Done");
    const i = await a.presentSheet();
    if (i < 0) return;
    await actions[i][1]();
  }
}

function importMessage(res) {
  const a = res.acc;
  if (res.status === "invalid") return null;
  if (res.status === "duplicate") return `Clipboard export for ${a.name} is already imported.`;
  const now = Date.now();
  const extra = res.status === "new" ? "\nNew account — use “Rename” to give it a name." : "";
  const running = (a.items || []).filter(i => i.end > now).length;
  const nb = (a.boostsExport || []).length;
  return `✅ ${a.name} updated (${running} upgrade${running === 1 ? "" : "s"} running)` +
    (nb ? `\n${nb} running boost${nb > 1 ? "s" : ""} detected: ${a.boostsExport.map(b => BOOST_TYPES[b.kind].name).join(", ")}` : "") +
    `\n${summaryLine(a, now)}${extra}`;
}

// ───────────────────────────────── Main ────────────────────────────────────

async function main() {
  initStorage();
  loadNameCache();

  if (config.runsInWidget) {
    const db = loadDB();
    try {
      const { acct } = parseParam(args.widgetParameter);
      const one = findAccount(db, acct);
      await refreshWars(one ? [one] : orderedAccounts(db), false);
      saveDB(db);
      await scheduleWarAlerts(db);
      await scheduleRaidAlerts(db);
      await scheduleGamesAlerts(db);
    } catch (e) { }
    // A few missing pictures per refresh (new upgrades synced in the background).
    try {
      const { acct } = parseParam(args.widgetParameter);
      const one = findAccount(db, acct);
      const items = (one ? [one] : orderedAccounts(db)).flatMap(a => a.items || []);
      await ensureIcons(items.concat((one ? [one] : orderedAccounts(db)).filter(a => a.clock).map(clockItem)), 4);
      await ensureBoostIcons(false);
      await ensureHelperIcons(false);
    } catch (e) { }
    const w = buildWidget(db, config.widgetFamily, args.widgetParameter);
    Script.setWidget(w);
    Script.complete();
    return;
  }

  // Read export: Shortcut input first, then clipboard.
  let input = args.shortcutParameter;
  if (input && typeof input !== "string") input = Array.isArray(input) ? input.join("\n") : JSON.stringify(input);
  let text = input || null;
  if (!parseExport(text || "")) {
    try { text = Pasteboard.paste(); } catch (e) { text = null; }
  }

  // Big downloads only when the app is open: a Shortcuts automation runs in the
  // background with little memory and time, and iOS pauses it after a failed run.
  if (config.runsInApp) await refreshRemoteNames().catch(() => {});
  const res = await importExport(text || "");
  const msg = importMessage(res);


  const qp = args.queryParameters || {};
  if (config.runsInApp && qp.action === "detail") {
    await detailFlow(qp.tag, qp.uid);
  } else if (config.runsInApp && qp.action === "addboost") {
    await addBoostFlow(qp.tag, qp.cat);
  } else if (config.runsInApp && qp.action === "boosts") {
    await boostsFlow();
  } else if (config.runsInApp && qp.action === "sync") {
    // Opened from the widget's ⟳ pill: just sync and say so.
    await info(msg ? "Clash sync" : "Nothing new to sync",
      msg || "Copy a fresh export first:\nClash → Settings → More Settings → Data Export → Copy");
  } else if (config.runsInApp) {
    await menu(msg);
  } else {
    // Background run (Shortcuts automation)
    if (CONFIRM_IMPORT && (res.status === "new" || res.status === "updated")) {
      await notifyNow(`✅ ${res.acc.name} synced`, summaryLine(res.acc, Date.now()));
    }
    Script.setShortcutOutput(msg || "No new Clash export on clipboard.");
    // Keep the background run short: wars and pictures are fetched by the widget
    // and when you open the app.
    Script.complete();
    return;
  }
  // Fetch any missing unit pictures last, so alerts are never held up by it.
  if (res.status === "new" || res.status === "updated") {
    try {
      const db = loadDB();
      await refreshWars(orderedAccounts(db), false);
      saveDB(db);
      await scheduleWarAlerts(db);
      await scheduleRaidAlerts(db);
      await scheduleGamesAlerts(db);
    } catch (e) { }
    try { await ensureIcons((res.acc.items || []).concat(res.acc.clock ? [clockItem(res.acc)] : []), config.runsInApp ? 25 : 10); } catch (e) { }
    try { await ensureBoostIcons(false); } catch (e) { }
    try { await ensureHelperIcons(false); } catch (e) { }
  }
  Script.complete();
}

if (typeof module !== "undefined" && module.exports && typeof config === "undefined") {
  // Loaded by a test harness — export internals, don't run.
  module.exports = { parseExport, plannedNotifications, fmtLeft, classify, itemLabel, buildWidget, importExport, initStorage, loadDB };
} else {
  await main();
}
