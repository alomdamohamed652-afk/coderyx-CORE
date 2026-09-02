const caseManager = require("./caseManager");
const guildConfig = require("./guildConfig");

function list(guildId, userId) {
  return caseManager.getForUser(guildId, userId).filter((c) => c.action === "warn");
}
function add(guildId, user, moderator, reason) {
  const record = caseManager.create({ guildId, action: "warn", target: user, moderator, reason, source: "command" });
  const threshold = Number(guildConfig.get(guildId, "moderation.warningThreshold", 0));
  return { record, count: list(guildId, user.id).length, threshold };
}
function count(guildId, userId) { return list(guildId, userId).length; }
module.exports = { list, add, count };
