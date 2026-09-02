const botRegistry = require("./botRegistry");
const entitlements = require("./entitlements");
function botCanUseFeature({ botId, guildId, feature }) {
  const bot = botRegistry.get(botId);
  if (!bot || !bot.guilds.includes(guildId)) return false;
  return entitlements.canUse(guildId, feature);
}
function getBotContext(botId, guildId) {
  const bot = botRegistry.get(botId);
  if (!bot || !bot.guilds.includes(guildId)) return null;
  return { botId, guildId, productId: bot.productId, plan: entitlements.getPlan(guildId) };
}
module.exports = { botCanUseFeature, getBotContext };
