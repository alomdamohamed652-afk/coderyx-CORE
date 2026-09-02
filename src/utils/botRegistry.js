const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "..", "data", "bot-registry.json");
let state = { bots: {} };
function load() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
  try { state = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { state = { bots: {} }; save(); }
  if (!state.bots || typeof state.bots !== "object") state.bots = {};
  return state;
}
function save() {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmp, FILE);
}
function register({ botId, ownerId, productId = null, name = null }) {
  if (!botId) throw new TypeError("botId is required");
  state.bots[botId] = { botId, ownerId, productId, name, guilds: state.bots[botId]?.guilds || [], updatedAt: new Date().toISOString() };
  save();
  return state.bots[botId];
}
function attachGuild(botId, guildId) {
  const bot = state.bots[botId];
  if (!bot || !guildId) return null;
  if (!bot.guilds.includes(guildId)) bot.guilds.push(guildId);
  bot.updatedAt = new Date().toISOString();
  save();
  return bot;
}
function get(botId) { return state.bots[botId] || null; }
function listByOwner(ownerId) { return Object.values(state.bots).filter(b => b.ownerId === ownerId); }
load();
module.exports = { load, save, register, attachGuild, get, listByOwner };
