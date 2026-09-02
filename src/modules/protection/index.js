const features = require("../../utils/features");
const logger = require("../../utils/logger");
const devLog = require("../../utils/devLogger");
const guildFeatures = require("../../utils/guildFeatures");
const caseManager = require("../../utils/caseManager");
const guildConfig = require("../../utils/guildConfig");

function isExempt(member, config) {
  if (!member) return true;
  if (config.exemptBots && member.user?.bot) return true;
  if (config.exemptUsers?.includes(member.id)) return true;
  if (member.roles?.cache?.some((role) => config.exemptRoles?.includes(role.id))) return true;
  return false;
}

async function executeAction(message, config) {
  const member = message.member;
  if (!member || isExempt(member, config)) return;

  const action = config.action || "timeout";
  const reason = config.reason || "Protected channel violation";
  let success = false;

  try {
    if (config.deleteMessage !== false && message.deletable) {
      await message.delete().catch(() => null);
    }

    if (action === "delete") {
      success = true;
    } else if (action === "warn") {
      success = true;
    } else if (action === "timeout") {
      if (!member.moderatable) return;
      success = await member.timeout(config.timeoutMs || 600000, reason).then(() => true).catch(() => false);
    } else if (action === "kick") {
      if (!member.kickable) return;
      success = await member.kick(reason).then(() => true).catch(() => false);
    } else if (action === "ban") {
      if (!member.bannable) return;
      success = await member.ban({ reason }).then(() => true).catch(() => false);
    }

    if (success && action !== "delete") {\n      caseManager.create({\n        guildId: message.guildId,\n        action: `protection:${action}`,\n        target: member.user,\n        moderator: message.client.user,\n        reason,\n        duration: action === "timeout" ? Math.floor((config.timeoutMs || 600000) / 1000) : null,\n        source: "protection"\n      });\n    }\n\n    await logger.general("protectionAction", {
      title: success ? "🛡️ تم تنفيذ حماية القناة" : "⚠️ تعذر تنفيذ حماية القناة",
      fields: [
        { name: "المستخدم", value: "<@" + member.id + ">", inline: true },
        { name: "القناة", value: "<#" + message.channelId + ">", inline: true },
        { name: "الإجراء", value: action, inline: true },
        { name: "السبب", value: reason }
      ],
      colorKey: success ? "warning" : "danger"
    }, message.guild);
  } catch (error) {
    devLog.error("[Protection] " + (error?.stack || error));
  }
}

module.exports = {
  name: "protection",
  version: "1.0.0",
  description: "Protected-channel enforcement.",
  enabledByDefault: false,
  dependencies: ["logger"],

  init({ bus, config, guildId }) {
    const protection = { ...(config.protection || {}), ...guildConfig.get(guildId || "", "protection", {}) };
    if (!protection?.channelId) {
      devLog.warn("[Protection] لم يتم تحديد channelId.");
      return;
    }

    bus.on("message:create", async (message) => {
      if (!guildFeatures.isEnabled(message.guildId, "protection", features.get("protection.enabled") === true)) return;
      if (!message.guild || message.channelId !== protection.channelId) return;
      await executeAction(message, protection);
    });
  }
};
