const fs = require("fs");
const path = require("path");
const devLog = require("./devLogger");

/**
 * Loads every event from src/events automatically.
 * Event failures are isolated so one bad handler cannot take down the process.
 */
function loadEvents(client, context) {
  const eventsPath = path.join(__dirname, "..", "events");
  const files = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

  let loaded = 0;

  for (const file of files) {
    try {
      const eventModule = require(path.join(eventsPath, file));

      if (!eventModule?.name || typeof eventModule.execute !== "function") {
        devLog.warn(`[EventLoader] تم تجاهل الملف "${file}" لأنه لا يحتوي على name/execute صحيحين.`);
        continue;
      }

      const handler = async (...args) => {
        try {
          await eventModule.execute(...args, context);
        } catch (error) {
          devLog.error(`[EventLoader] فشل حدث "${eventModule.name}" في "${file}": ${error?.stack || error}`);
        }
      };

      if (eventModule.once) client.once(eventModule.name, handler);
      else client.on(eventModule.name, handler);

      loaded++;
    } catch (error) {
      devLog.error(`[EventLoader] فشل تحميل "${file}": ${error?.stack || error}`);
    }
  }

  devLog.info(`[EventLoader] تم تحميل ${loaded} حدث/أحداث بنجاح.`);
}

module.exports = { loadEvents };
