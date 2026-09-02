const fs = require("fs");
const path = require("path");
const devLog = require("./devLogger");

const MODULES_DIR = path.join(__dirname, "..", "modules");

function discoverModules() {
  const dirs = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const modules = [];

  for (const dir of dirs) {
    try {
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
    } catch (error) {
      devLog.error(`[ModuleLoader] فشل تحميل Module "${dir}": ${error?.stack || error}`);
    }
  }

  return modules;
}

function loadModules(modules, context) {
  const names = new Set(modules.map((m) => m.name));

  for (const mod of modules) {
    const missingDeps = mod.dependencies.filter((dep) => !names.has(dep));

    if (missingDeps.length > 0) {
      devLog.warn(`[ModuleLoader] تم تجاوز موديول "${mod.name}" - Dependencies مفقودة: ${missingDeps.join(", ")}`);
      continue;
    }

    try {
      mod.init(context);
      devLog.success(`[ModuleLoader] تم تشغيل موديول: ${mod.name} v${mod.version}`);
    } catch (error) {
      devLog.error(`[ModuleLoader] فشل تشغيل Module "${mod.name}": ${error?.stack || error}`);
    }
  }
}

module.exports = { discoverModules, loadModules };
