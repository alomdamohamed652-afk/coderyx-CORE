const { Events } = require("discord.js");

/**
 * يعتبر الرول "تغيّر" إذا اختلف أي من: الاسم، اللون، الصلاحيات، الترتيب (Position)،
 * الظهور المنفصل (Hoist)، أو إمكانية المنشن. التفاصيل الدقيقة لكل تغيير تُحسب في
 * modules/logger (مكان معالجة المحتوى)، هذا الملف فقط يكتشف "هل تغيّر شيء أصلاً؟".
 */
function hasMeaningfulChange(oldRole, newRole) {
  return (
    oldRole.name !== newRole.name ||
    oldRole.hexColor !== newRole.hexColor ||
    oldRole.hoist !== newRole.hoist ||
    oldRole.mentionable !== newRole.mentionable ||
    oldRole.position !== newRole.position ||
    !oldRole.permissions.equals(newRole.permissions)
  );
}

module.exports = {
  name: Events.GuildRoleUpdate,
  execute(oldRole, newRole, ctx) {
    if (!hasMeaningfulChange(oldRole, newRole)) return;

    ctx.bus.emit("role:update", { oldRole, newRole });
  }
};
