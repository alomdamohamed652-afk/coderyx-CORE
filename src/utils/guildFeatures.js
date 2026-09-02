const features = require("./features");
const guildConfig = require("./guildConfig");

/**
 * Guild-scoped feature facade.
 * Storage remains the current local feature store for now; the API is intentionally
 * guild-aware so it can be backed by the platform database later without changing modules.
 */
function key(guildId, feature) {
  if (!guildId) throw new TypeError("guildId is required");
  if (!feature) throw new TypeError("feature is required");
  return `guild.${guildId}.${feature}`;
}

function isEnabled(guildId, feature, fallback = false) {
  const scoped = features.get(key(guildId, feature));
  if (typeof scoped === "boolean") return scoped;

  const global = features.get(feature);
  return typeof global === "boolean" ? global : fallback;
}

function setEnabled(guildId, feature, enabled) {
  if (typeof enabled !== "boolean") throw new TypeError("enabled must be boolean");
  features.set(key(guildId, feature), enabled);
  guildConfig.set(guildId, `feature.${feature}`, enabled);
}

function snapshot(guildId) {
  const prefix = `guild.${guildId}.`;
  return Object.keys(features.all()).filter((k) => k.startsWith(prefix))
    .reduce((out, k) => {
      out[k.slice(prefix.length)] = features.get(k);
      return out;
    }, { ...Object.keys(guildConfig.getAll(guildId)).filter((k) => k.startsWith("feature.")).reduce((out, k) => { out[k.slice(8)] = guildConfig.get(guildId, k); return out; }, {}) });
}

module.exports = { isEnabled, setEnabled, snapshot };
