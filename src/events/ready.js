const { Events } = require("discord.js");
const devLog = require("../utils/devLogger");
const { validate } = require("../utils/configValidate");
const commandRegistry = require("../utils/commandRegistry");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client, ctx) {
    devLog.success(`تم تسجيل الدخول كـ ${client.user.tag}`);

    await registerCommands(client, ctx);
    validate(client, ctx.config);

    ctx.bus.emit("system:ready", client);
  }
};

/**
 * يسجّل كل الأوامر المتراكمة في commandRegistry (Dashboard + Moderation + أي Module مستقبلي)
 * دفعة واحدة - بدون أي قائمة Hardcoded هنا.
 */
async function registerCommands(client, ctx) {
  const commands = commandRegistry.getAll().map((c) => c.data);

  if (!commands.length) {
    devLog.warn("[Commands] لا توجد أوامر مسجّلة في commandRegistry.");
    return;
  }

  try {
    if (ctx.env.guildId) {
      const guild = await client.guilds.fetch(ctx.env.guildId).catch(() => null);
      if (guild) {
        await guild.commands.set(commands);
        devLog.success(`تم تسجيل ${commands.length} أمر على السيرفر المحدد في GUILD_ID.`);
        return;
      }
    }

    await client.application.commands.set(commands);
    devLog.info(`تم تسجيل ${commands.length} أمر بشكل عام (Global) - قد يستغرق الظهور حتى ساعة.`);
  } catch (err) {
    devLog.error(`فشل تسجيل الأوامر: ${err.message}`);
  }
}
