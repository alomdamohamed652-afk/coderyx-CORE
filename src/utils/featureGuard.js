const guildFeatures = require("./guildFeatures");

function isEnabled(guildId, feature, fallback = false) {
  return guildFeatures.isEnabled(guildId, feature, fallback);
}

function assertEnabled(guildId, feature, fallback = false) {
  if (!isEnabled(guildId, feature, fallback)) {
    const error = new Error(`Feature "${feature}" is not enabled for this guild.`);
    error.code = "FEATURE_DISABLED";
    error.feature = feature;
    throw error;
  }
  return true;
}

module.exports = { isEnabled, assertEnabled };
