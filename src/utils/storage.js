const guildConfig = require("./guildConfig");
const caseManager = require("./caseManager");

module.exports = {
  config: guildConfig,
  cases: caseManager,
  async health() {
    try {
      guildConfig.getAll("__health__");
      caseManager.list("__health__", 1);
      return { ok: true, backend: "local-json" };
    } catch (error) {
      return { ok: false, backend: "local-json", error: error.message };
    }
  }
};
