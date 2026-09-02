const { EventEmitter } = require("node:events");

/**
 * Bus داخلي بسيط (Pub/Sub).
 *
 * ملفات events/ تستقبل أحداث Discord.js الخام وتحوّلها إلى أحداث داخلية (مثل "member:join").
 * ملفات modules/ تستمع فقط لهذه الأحداث الداخلية، ولا تتعامل مع Discord.js مباشرة ولا تعرف
 * بوجود موديولات أخرى. هذا ما يسمح بإضافة موديول جديد مستقبلاً دون تعديل القلب أو الموديولات الحالية.
 */
class Bus extends EventEmitter {}

module.exports = new Bus();
