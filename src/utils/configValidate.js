const devLog = require("./devLogger");
const logger = require("./logger");

/**
 * Config Validation
 *
 * يُستدعى مرة واحدة عند "ready". إذا كانت أي قناة أو رول محدد في config/ غير موجود في
 * السيرفر، لا يتوقف البوت أبداً - فقط يسجّل Warning في الكونسول وفي System Logs (إن كانت
 * قناة System Logs نفسها صالحة) ثم يستمر بالعمل بشكل طبيعي.
 */
function validate(client, config) {
  for (const guild of client.guilds.cache.values()) {
    const warnings = [];

    if (config.welcome.message.enabled) {
      const channelId = config.welcome.message.channelId;
      if (!channelId || !guild.channels.cache.has(channelId)) {
        warnings.push(`روم الترحيب (welcome.message.channelId) غير موجود في سيرفر "${guild.name}".`);
      }
    }

    if (config.welcome.autoRole.enabled) {
      const roleId = config.welcome.autoRole.roleId;
      if (!roleId || !guild.roles.cache.has(roleId)) {
        warnings.push(`رتبة Auto Role (welcome.autoRole.roleId) غير موجودة في سيرفر "${guild.name}".`);
      }
    }

    for (const section of ["member", "message", "general", "voice", "system"]) {
      const sectionConfig = config.logger[section];
      const channelId = sectionConfig.channelId || config.logger.fallbackChannelId;

      if (sectionConfig.enabled && (!channelId || !guild.channels.cache.has(channelId))) {
        warnings.push(`قناة لوجات "${section}" غير موجودة في سيرفر "${guild.name}" ولا توجد fallbackChannelId صالحة.`);
      }
    }

    for (const message of warnings) {
      devLog.warn(`[ConfigValidate] ${message}`);
      logger.system("warning", { title: "⚠️ مشكلة في الإعدادات", description: message, colorKey: "warning" }, guild);
    }
  }
}

module.exports = { validate };
