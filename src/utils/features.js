const fs = require("fs");
const path = require("path");
const devLog = require("./devLogger");

const FILE_PATH = path.join(__dirname, "..", "..", "data", "toggles.json");

let state = {};

function load(defaults) {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(FILE_PATH)) {
    saveToDisk(defaults);
  }

  try {
    state = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Expected a JSON object");
  } catch (err) {
    devLog.error(`[Features] ملف toggles.json تالف، سيتم استخدام القيم الافتراضية: ${err.message}`);
    state = { ...defaults };
    saveToDisk(state);
  }

  let changed = false;
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in state)) {
      state[key] = value;
      changed = true;
    }
  }
  if (changed) save();

  return state;
}

function get(key) {
  return state[key];
}

function set(key, value) {
  if (typeof value !== "boolean") throw new TypeError(`Feature "${key}" must be boolean`);
  state[key] = value;
  save();
}

function save() {
  saveToDisk(state);
}

function saveToDisk(value) {
  const dir = path.dirname(FILE_PATH);
  const tempPath = `${FILE_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tempPath, FILE_PATH);
}

module.exports = { load, get, set };
