const features = require("../../utils/features");
const logger = require("../../utils/logger");
const devLog = require("../../utils/devLogger");
const guildFeatures = require("../../utils/guildFeatures");
const caseManager = require("../../utils/caseManager");
const guildConfig = require("../../utils/guildConfig");
const featureGuard = require("../../utils/featureGuard");
const messageBuckets = new Map();

function isExempt(member, config) {
  if (!member) return true;
  if (config.exemptBots && member.user?.bot) return true;
  if (config.exemptUsers?.includes(member.id)) return true;
  if (member.roles?.cache?.some((role) => config.exemptRoles?.includes(role.id))) return true;
  return false;
}

function rateLimited(message, config) {
  const limit = Number(config.maxMessages || 0);
  if (limit <= 0) return false;
  const windowMs = Number(config.windowMs || 5000);
  const now = Date.now();
  const key = `${message.guildId}:${message.author.id}`;
  const recent = (messageBuckets.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  messageBuckets.set(key, recent);
  return recent.length > limit;
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

    if (success && action !== "delete") {
      caseManager.create({
        guildId: message.guildId,
        action: `protection:${action}`,
        target: member.user,
        moderator: message.client.user,
        reason,
        duration: action === "timeout" ? Math.floor((config.timeoutMs || 600000) / 1000) : null,
        source: "protection"
      });
    }

    await logger.general("protectionAction", {
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

  init({ bus, config }) {
    const protectionDefaults = config.protection || {};
    const protection = protectionDefaults;
    if (!protection?.channelId) {
      devLog.warn("[Protection] لم يتم تحديد channelId.");
      return;
    }

    bus.on("message:create", async (message) => {
      if (!guildFeatures.isEnabled(message.guildId, "protection", features.get("protection.enabled") === true)) return;
      if (!message.guild || message.channelId !== guildConfig.get(message.guildId, "protection.channelId", protection.channelId)) return;
      const guildProtection = { ...protection, ...(guildConfig.get(message.guildId, "protection", {}) || {}) };
      if (guildProtection.antiSpam && featureGuard.isEnabled(message.guildId, "automod", false) && rateLimited(message, guildProtection)) {
        await executeAction(message, { ...guildProtection, action: guildProtection.spamAction || "timeout", reason: guildProtection.spamReason || "Anti-spam violation" });
        return;
      }
      if (guildProtection.maxMentions && featureGuard.isEnabled(message.guildId, "automod", false) && (message.mentions?.users?.size || 0) >= guildProtection.maxMentions) {
        await executeAction(message, { ...guildProtection, action: guildProtection.mentionAction || "timeout", reason: guildProtection.mentionReason || "Mass mention violation" });
        return;
      }
      await executeAction(message, guildProtection);
    });
  }
};
