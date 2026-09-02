const { diffWords } = require("diff");

/**
 * Smart Message Diff - بدل عرض الرسالة كاملة قبل/بعد، يعرض فقط الفرق الفعلي بشكل واضح:
 *
 *   ➕ أضيف: مرحباً
 *   ➖ حذف: مرحباً
 *   🔄 تغيير: محمد → أحمد
 *
 * كلمة محذوفة متبوعة مباشرة بكلمة مضافة تُعتبر "تغيير" (Replacement) في سطر واحد،
 * بدل عرضها كحذف وإضافة منفصلين.
 */
function smartDiff(oldText, newText, max = 950) {
  const parts = diffWords(oldText || "", newText || "");
  const lines = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const value = part.value.trim();
    if (!value) continue;

    if (part.removed) {
      const next = parts[i + 1];

      if (next?.added && next.value.trim()) {
        lines.push(`🔄 **تغيير:** ~~${value}~~ → **${next.value.trim()}**`);
        i++; // تم استخدام العنصر التالي بالفعل كجزء من "التغيير"
        continue;
      }

      lines.push(`➖ **حذف:** ${value}`);
    } else if (part.added) {
      lines.push(`➕ **أضيف:** ${value}`);
    }
  }

  if (!lines.length) return "لا يوجد تغيير ملحوظ في النص.";

  const result = lines.join("\n");
  return result.length > max ? `${result.slice(0, max)}…` : result;
}

module.exports = { smartDiff };
