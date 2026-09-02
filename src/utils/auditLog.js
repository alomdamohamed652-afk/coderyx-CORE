const devLog = require("./devLogger");

/**
 * أحداث كثيرة في Discord (Kick، حذف رسالة، نقل عضو في الفويس...) لا تأتي بحدث Gateway مستقل
 * يوضّح "مين نفّذ الإجراء" - فقط حدث عام (مثل guildMemberRemove أو messageDelete) بدون تفاصيل المنفّذ.
 * لذلك نتحقق من سجل التدقيق (Audit Log) خلال ثوانٍ قليلة من الحدث لمعرفة المنفّذ الحقيقي.
 *
 * يتطلب صلاحية "View Audit Log" للبوت.
 */
async function findRecentAuditEntry(guild, { type, targetId, withinMs = 5000, extraCheck, actionId, predicate } = {}) {
  try {
    const audit = await guild.fetchAuditLogs({ type, limit: 10 });
    const entry = audit.entries.find((e) => {
      if (targetId && e.target?.id !== targetId) return false;
      if (Date.now() - e.createdTimestamp > withinMs) return false;
      if (extraCheck && !extraCheck(e)) return false;\n      if (actionId && e.id !== actionId) return false;\n      if (predicate && !predicate(e)) return false;
      return true;
    });
    return entry || null;
  } catch (err) {
    devLog.warn(`[AuditLog] لا يمكن قراءة سجل التدقيق (تحقق من صلاحية View Audit Log): ${err.message}`);
    return null;
  }
}

module.exports = { findRecentAuditEntry };
