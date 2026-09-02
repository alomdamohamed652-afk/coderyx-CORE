const fs = require("fs");
const path = require("path");
const commandRegistry = require("../../utils/commandRegistry");
const devLog = require("../../utils/devLogger");

const COMMANDS_DIR = path.join(__dirname, "commands");

/**
 * أوامر الإدارة الأساسية. كل أمر في ملف مستقل داخل commands/ يُصدّر { data, execute } -
 * إضافة أمر جديد مستقبلاً = ملف جديد فقط في هذا المجلد، بدون تعديل هذا الملف.
 */
module.exports = {
  name: "moderation",
  version: "1.0.0",
  description: "أوامر الإدارة الأساسية: clear, ban, unban, kick, timeout, untimeout, lock, unlock, slowmode, userinfo, serverinfo, avatar, ping",
  enabledByDefault: true,
  dependencies: [],

  init() {
    const files = fs.readdirSync(COMMANDS_DIR).filter((file) => file.endsWith(".js"));

    for (const file of files) {
      const command = require(path.join(COMMANDS_DIR, file));

      if (!command?.data || typeof command.execute !== "function") {
        devLog.warn(`[Moderation] تم تجاهل الملف "${file}" لأنه لا يحتوي على data/execute صحيحين.`);
        continue;
      }

      commandRegistry.register(command.data, command.execute);
    }
  }
};
