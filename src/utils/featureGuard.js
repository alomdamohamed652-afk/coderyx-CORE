const guildFeatures = require("./guildFeatures");

function requireFeature(guildId, feature, fallback = false) {
  return guildFeatures.isEnabled(guildId, feature, fallback);
}

function assertFeature(guildId, feature, fallback = false) {
  if (!requireFeature(guildId, feature, fallback)) {
    const error = new Error(`Feature "${feature}" is not enabled for this guild.`);
    error.code = "FEATURE_DISABLED";
    error.feature = feature;
    throw error;
  }
}

module.exports = { requireFeature, assertFeature };
