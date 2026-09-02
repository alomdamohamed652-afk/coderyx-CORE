const { Events } = require("discord.js");

function overwritesEqual(oldMap, newMap) {
  if (oldMap.size !== newMap.size) return false;

  for (const [id, overwrite] of oldMap) {
    const newOverwrite = newMap.get(id);
    if (!newOverwrite) return false;
    if (overwrite.allow.bitfield !== newOverwrite.allow.bitfield) return false;
    if (overwrite.deny.bitfield !== newOverwrite.deny.bitfield) return false;
  }

  return true;
}

/**
 * يعتبر الروم "تغيّر" إذا اختلف أي من: الاسم، الـ Topic، الـ NSFW، الـ Slowmode، الفئة (Category)،
 * أو صلاحيات الروم (Permission Overwrites - تشمل Lock/Unlock). التفاصيل الدقيقة لكل تغيير
 * تُحسب في modules/logger، هذا الملف فقط يكتشف "هل تغيّر شيء أصلاً؟".
 */
function hasMeaningfulChange(oldChannel, newChannel) {
  if (!("name" in oldChannel)) return false;

  return (
    oldChannel.name !== newChannel.name ||
    oldChannel.topic !== newChannel.topic ||
    oldChannel.nsfw !== newChannel.nsfw ||
    oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser ||
    oldChannel.parentId !== newChannel.parentId ||
    !overwritesEqual(oldChannel.permissionOverwrites.cache, newChannel.permissionOverwrites.cache)
  );
}

module.exports = {
  name: Events.ChannelUpdate,
  execute(oldChannel, newChannel, ctx) {
    if (!hasMeaningfulChange(oldChannel, newChannel)) return;

    ctx.bus.emit("channel:update", { oldChannel, newChannel });
  }
};
