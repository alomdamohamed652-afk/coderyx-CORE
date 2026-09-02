const fs = require("fs");
const path = require("path");
const devLog = require("./devLogger");

const FILE_PATH = path.join(__dirname, "..", "..", "data", "toggles.json");

let state = {};

/**
 * Features (Toggle Store)
 *
 * هذا هو المخزن الوحيد لحالة "تشغيل/إيقاف" التي يتحكم بها /dashboard وقت التشغيل.
 * يُحمَّل مرة واحدة عند بدء البوت بقيم افتراضية (من config/ أو من manifest الموديول)،
 * وبعد ذلك أي تغيير من /dashboard يُحفظ فوراً في data/toggles.json دون لمس أي ملف كونفيج
 * ودون الحاجة لإعادة تشغيل البوت.
 */
function load(defaults) {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(defaults, null, 2));
  }

  try {
    state = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  } catch (err) {
    devLog.error(`[Features] ملف toggles.json تالف، سيتم استخدام القيم الافتراضية: ${err.message}`);
    state = {};
  }

  // أي مفتاح جديد ظهر بعد تحديث المشروع (موديول جديد مثلاً) يُضاف تلقائياً دون فقد القيم المحفوظة
  let changed = false;
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in state)) {
      state[key] = value;
      changed = true;
    }
  }
  if (changed) save();

  return state;
}

function get(key) {
  return state[key];
}

function set(key, value) {
  state[key] = value;
  save();
}

function save() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2));
}

module.exports = { load, get, set };
