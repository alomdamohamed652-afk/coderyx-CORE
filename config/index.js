/**
 * نقطة الدخول الموحدة لجميع ملفات الكونفيج.
 * أي وحدة جديدة مستقبلاً تضيف ملفها هنا فقط دون تعديل أي مكان آخر.
 */

const branding = require("./branding");
const welcome = require("./welcome");
const logger = require("./logger");

module.exports = {
  branding,
  welcome,
  logger
};
