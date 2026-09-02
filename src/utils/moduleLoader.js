const fs = require("fs");
const path = require("path");
const devLog = require("./devLogger");

const MODULES_DIR = path.join(__dirname, "..", "modules");

/**
 * يقرأ كل مجلد داخل src/modules/ ويستخرج الـ manifest الخاص به (name, version, description,
 * enabledByDefault, dependencies) مباشرة من index.js الخاص بالموديول - بدون ملف manifest منفصل.
 * إضافة موديول جديد = مجلد جديد فقط، بدون تعديل هذا الملف.
 */
function discoverModules() {
  const dirs = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const modules = [];

  for (const dir of dirs) {
    const mod = require(path.join(MODULES_DIR, dir));

    if (!mod?.name || typeof mod.init !== "function") {
      devLog.warn(`[ModuleLoader] تم تجاهل "${dir}" لأنه لا يحتوي على name/init صحيحين.`);
      continue;
    }

    modules.push({
      name: mod.name,
      version: mod.version || "1.0.0",
      description: mod.description || "",
      enabledByDefault: mod.enabledByDefault !== false,
      dependencies: mod.dependencies || [],
      init: mod.init
    });
  }

  return modules;
}

/**
 * يتحقق من أن Dependencies كل موديول موجودة فعلاً قبل تشغيله، ثم يستدعي init() لكل موديول صالح.
 */
function loadModules(modules, context) {
  const names = modules.map((m) => m.name);

  for (const mod of modules) {
    const missingDeps = mod.dependencies.filter((dep) => !names.includes(dep));

    if (missingDeps.length > 0) {
      devLog.warn(`[ModuleLoader] تم تجاوز موديول "${mod.name}" - Dependencies مفقودة: ${missingDeps.join(", ")}`);
      continue;
    }

    mod.init(context);
    devLog.success(`[ModuleLoader] تم تشغيل موديول: ${mod.name} v${mod.version}`);
  }
}

module.exports = { discoverModules, loadModules };
