const { Events } = require("discord.js");

/**
 * كل خصائص السيرفر (الاسم/الأيقونة/الـ Banner/Verification Level/AFK Channel/AFK Timeout)
 * تتغيّر عادة دفعة واحدة من نفس مكان واحد في Discord ("Edit Server Settings")، فيُفضَّل تجميعها
 * في حدث داخلي واحد "guild:update" بدل عدة أحداث منفصلة - يقلل التكرار ويسمح بـ Audit Log
 * lookup واحد فقط للمسؤول بدل تكراره لكل خاصية.
 */
module.exports = {
  name: Events.GuildUpdate,
  execute(oldGuild, newGuild, ctx) {
    const changed =
      oldGuild.name !== newGuild.name ||
      oldGuild.icon !== newGuild.icon ||
      oldGuild.banner !== newGuild.banner ||
      oldGuild.verificationLevel !== newGuild.verificationLevel ||
      oldGuild.afkChannelId !== newGuild.afkChannelId ||
      oldGuild.afkTimeout !== newGuild.afkTimeout;

    if (!changed) return;

    ctx.bus.emit("guild:update", { oldGuild, newGuild });
  }
};
