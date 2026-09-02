const fs = require("fs");
const path = require("path");
const devLog = require("./devLogger");

const FILE = path.join(__dirname, "..", "..", "data", "cases.json");
let state = {};

function load() {
  if (!fs.existsSync(path.dirname(FILE))) fs.mkdirSync(path.dirname(FILE), { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "{}");
  try {
    state = JSON.parse(fs.readFileSync(FILE, "utf8")) || {};
  } catch (error) {
    devLog.error("[CaseManager] cases.json is invalid; resetting storage.");
    state = {};
    save();
  }
}
function save() {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, FILE);
}
function create({ guildId, action, target, moderator, reason, duration, source = "command" }) {
  if (!state[guildId]) state[guildId] = { nextId: 1, cases: [] };
  const bucket = state[guildId];
  const id = bucket.nextId++;
  const record = {
    id, guildId, action, targetId: target?.id || null, targetTag: target?.tag || target?.username || null,
    moderatorId: moderator?.id || null, moderatorTag: moderator?.tag || moderator?.username || null,
    reason: reason || "No reason provided", duration: duration || null, source,
    createdAt: new Date().toISOString()
  };
  bucket.cases.push(record);
  save();
  return record;
}
function list(guildId, limit = 50) {
  return (state[guildId]?.cases || []).slice(-limit).reverse();
}
function get(guildId, id) {
  return (state[guildId]?.cases || []).find((c) => c.id === Number(id)) || null;
}
load();
module.exports = { create, list, get, load };
