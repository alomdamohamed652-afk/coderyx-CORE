const guildConfig = require("./guildConfig");
const featureCatalog = require("./featureCatalog");

function getPlan(guildId) {
  return guildConfig.get(guildId, "license.plan", "free");
}
function isLicensed(guildId, feature) {
  const item = featureCatalog[feature];
  if (!item) return false;
  if (!item.paid) return true;
  const overrides = guildConfig.get(guildId, "license.features", []);
  if (Array.isArray(overrides) && overrides.includes(feature)) return true;
  const plan = getPlan(guildId);
  const plans = guildConfig.get(guildId, "license.planFeatures", {});
  return Array.isArray(plans?.[plan]) && plans[plan].includes(feature);
}
function canUse(guildId, feature) {
  return !featureCatalog[feature]?.paid || isLicensed(guildId, feature);
}
module.exports = { getPlan, isLicensed, canUse };
