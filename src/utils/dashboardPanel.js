const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "..", "..", "data", "dashboard-panel.json");

/**
 * يحفظ مكان لوحة التحكم الدائمة (channelId + messageId) لو العميل ثبّتها في روم معيّن
 * عبر /dashboard panel. هذا يسمح بتحديث نفس الرسالة تلقائياً من أي مكان آخر تتغيّر فيه
 * حالة أي نظام (حتى لو التغيير حصل من /dashboard view عند شخص تاني).
 */
function get() {
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  } catch {
    return null;
  }
}

function set(data) {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

module.exports = { get, set };
