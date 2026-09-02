const store = new Map();

/**
 * أي إجراء يقوم به البوت نفسه (Ban/Kick/Timeout/Lock...) عبر أمر Slash يظهر في
 * Discord Audit Log باسم "البوت" وليس باسم المسؤول الحقيقي الذي كتب الأمر.
 *
 * الحل: الأمر يسجّل هنا "مين فعلاً نفّذ الإجراء" لحظة تنفيذه، والـ Handler السلبي
 * (اللي بيستمع لحدث الـ Gateway العادي) يقرأ هذه القيمة أولاً قبل اللجوء لـ Audit Log.
 * القيمة تُحذف تلقائياً بعد ثواني قليلة (TTL) لمنع تراكم بيانات قديمة في الذاكرة.
 */
function record(key, data, ttlMs = 8000) {
  const existing = store.get(key);
  if (existing) clearTimeout(existing.timeout);

  const timeout = setTimeout(() => store.delete(key), ttlMs);
  store.set(key, { ...data, timeout });
}

function consume(key) {
  const entry = store.get(key);
  if (!entry) return null;

  clearTimeout(entry.timeout);
  store.delete(key);

  const { timeout, ...data } = entry;
  return data;
}

module.exports = { record, consume };
