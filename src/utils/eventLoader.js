const fs = require("fs");
const path = require("path");
const devLog = require("./devLogger");

/**
 * يقرأ كل ملف داخل src/events/ ويربطه تلقائياً بـ client.on / client.once.
 * إضافة حدث جديد = ملف جديد فقط، بدون تعديل هذا الملف.
 */
function loadEvents(client, context) {
  const eventsPath = path.join(__dirname, "..", "events");
  const files = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

  let loaded = 0;

  for (const file of files) {
    const eventModule = require(path.join(eventsPath, file));

    if (!eventModule?.name || typeof eventModule.execute !== "function") {
      devLog.warn(`[EventLoader] تم تجاهل الملف "${file}" لأنه لا يحتوي على name/execute صحيحين.`);
      continue;
    }

    const handler = (...args) => eventModule.execute(...args, context);

    if (eventModule.once) {
      client.once(eventModule.name, handler);
    } else {
      client.on(eventModule.name, handler);
    }

    loaded++;
  }

  devLog.info(`[EventLoader] تم تحميل ${loaded} حدث/أحداث بنجاح.`);
}

module.exports = { loadEvents };
