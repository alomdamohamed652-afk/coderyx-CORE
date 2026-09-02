const features = require("./features");
const guildConfig = require("./guildConfig");
const featureCatalog = require("./featureCatalog");

function key(guildId, feature) {
  if (!guildId) throw new TypeError("guildId is required");
  if (!feature) throw new TypeError("feature is required");
  return `guild.${guildId}.${feature}`;
}

function isEnabled(guildId, feature, fallback = false) {
  const scoped = features.get(key(guildId, feature));
  if (typeof scoped === "boolean") return scoped;

  const configured = guildConfig.get(guildId, `feature.${feature}`);
  if (typeof configured === "boolean") return configured;

  const global = features.get(feature);
  if (typeof global === "boolean") return global;

  return fallback;
}

function setEnabled(guildId, feature, enabled) {
  if (typeof enabled !== "boolean") throw new TypeError("enabled must be boolean");

  features.set(key(guildId, feature), enabled);
  guildConfig.set(guildId, `feature.${feature}`, enabled);
}

function snapshot(guildId) {
  const out = {};

  for (const [name, meta] of Object.entries(featureCatalog)) {
    out[name] = isEnabled(guildId, name, Boolean(meta.defaultEnabled));
  }

  const configured = guildConfig.getAll(guildId);
  for (const name of Object.keys(configured)) {
    if (name.startsWith("feature.")) {
      out[name.slice(8)] = Boolean(configured[name]);
    }
  }

  return out;
}

module.exports = { isEnabled, setEnabled, snapshot };
