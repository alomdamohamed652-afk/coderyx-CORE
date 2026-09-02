const guildFeatures = require("./guildFeatures");
const entitlements = require("./entitlements");

function isEnabled(guildId, feature, fallback = false) {
  if (!guildFeatures.isEnabled(guildId, feature, fallback)) return false;
  return entitlements.canUse(guildId, feature);
}
function assertEnabled(guildId, feature, fallback = false) {
  if (!isEnabled(guildId, feature, fallback)) {
    const error = new Error(`Feature "${feature}" is not enabled or licensed for this guild.`);
    error.code = "FEATURE_DISABLED";
    error.feature = feature;
    throw error;
  }
  return true;
}
module.exports = { isEnabled, assertEnabled };
