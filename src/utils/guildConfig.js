const fs = require("fs");
const path = require("path");
const devLog = require("./devLogger");

const FILE = path.join(__dirname, "..", "..", "data", "guild-config.json");
let state = {};

function ensure() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "{}");
}
function load() {
  ensure();
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    state = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    devLog.error("[GuildConfig] Invalid guild-config.json; resetting.");
    state = {};
    save();
  }
  return state;
}
function save() {
  ensure();
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmp, FILE);
}
function ensureGuild(guildId) {
  if (!guildId) throw new TypeError("guildId is required");
  if (!state[guildId]) state[guildId] = {};
  return state[guildId];
}
function get(guildId, key, fallback = undefined) {
  const guild = state[guildId];
  return guild && key in guild ? guild[key] : fallback;
}
function set(guildId, key, value) {
  const guild = ensureGuild(guildId);
  guild[key] = value;
  save();
  return value;
}
function patch(guildId, values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) throw new TypeError("values must be an object");
  Object.assign(ensureGuild(guildId), values);
  save();
  return state[guildId];
}
function getAll(guildId) {
  return { ...(state[guildId] || {}) };
}
function removeGuild(guildId) {
  if (state[guildId]) {
    delete state[guildId];
    save();
  }
}
load();

module.exports = { load, save, get, set, patch, getAll, removeGuild };
