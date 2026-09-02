/**
 * Logger داخلي بسيط لإخراج الكونسول فقط (تشغيل/أخطاء/تحذيرات).
 * هذا غير مرتبط بـ "Logger System" الخاص بالسيرفر - هذا فقط لمطور البوت.
 */

const tag = (label, color) => `\x1b[${color}m[${label}]\x1b[0m`;

module.exports = {
  info: (msg) => console.log(`${tag("INFO", 36)} ${msg}`),
  success: (msg) => console.log(`${tag("OK", 32)} ${msg}`),
  warn: (msg) => console.warn(`${tag("WARN", 33)} ${msg}`),
  error: (msg) => console.error(`${tag("ERROR", 31)} ${msg}`)
};
