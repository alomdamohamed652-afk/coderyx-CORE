const { findRecentAuditEntry } = require("./auditLog");
const pendingActions = require("./pendingActions");

// المدة التي ننتظرها قبل قراءة Audit Log عند عدم وجود pendingActions.
// Discord أحياناً يستغرق ثانية أو اتنين لكتابة السجل فعلياً - القراءة الفورية (0ms) كانت
// أحياناً ترجع "لا يوجد" حتى لو الإجراء حصل فعلاً من مسؤول (مثل Mute/Deafen/Disconnect في الفويس).
const AUDIT_LOG_DELAY_MS = 1200;
const DEFAULT_AUDIT_WINDOW_MS = 5000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * يحدد "مين نفّذ الإجراء فعلاً" بالأولوية:
 *
 * 1) لو الإجراء جاء من أمر Slash داخل البوت نفسه (مسجَّل مسبقاً في pendingActions عبر
 *    pendingActions.record) → يُستخدم المسؤول الحقيقي اللي كتب الأمر، لأن Audit Log
 *    في هذه الحالة سيُظهر "البوت" نفسه كمنفّذ وهذا غير مفيد. هذا المسار فوري بدون انتظار.
 * 2) غير ذلك → نرجع لـ Audit Log (الإجراء حصل يدوياً من واجهة Discord مباشرة)، بعد انتظار
 *    قصير (AUDIT_LOG_DELAY_MS) لإعطاء Discord وقتاً كافياً لكتابة السجل.
 *
 * هذا الملف هو المكان الوحيد الذي يحوي هذا المنطق - أي Handler (Member/Message/Role/
 * Channel/Voice/Guild) يستخدمه بدل تكرار نفس الكود.
 */
async function resolveExecutor({ pendingKey, guild, auditType, targetId, extraCheck, predicate, actionId, withinMs = DEFAULT_AUDIT_WINDOW_MS } = {}) {
  const pending = pendingKey ? pendingActions.consume(pendingKey) : null;

  if (pending) {
    return { executor: pending.executor || null, reason: pending.reason || null, viaCommand: true };
  }

  if (!auditType || !guild) {
    return { executor: null, reason: null, viaCommand: false };
  }

  await wait(AUDIT_LOG_DELAY_MS);

  const entry = await findRecentAuditEntry(guild, { type: auditType, targetId, extraCheck, predicate, actionId, withinMs });

  return { executor: entry?.executor || null, reason: entry?.reason || null, entry, viaCommand: false };
}

module.exports = { resolveExecutor };
