const { Client, GatewayIntentBits, Partials } = require("discord.js");

const { loadEnv } = require("./utils/env");
const bus = require("./utils/bus");
const features = require("./utils/features");
const logger = require("./utils/logger");
const devLog = require("./utils/devLogger");
const { loadEvents } = require("./utils/eventLoader");
const { discoverModules, loadModules } = require("./utils/moduleLoader");
const database = require("./database");

const config = require("../config");
const env = loadEnv();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Privileged - فعّله من Developer Portal
    GatewayIntentBits.GuildModeration, // Ban events
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Privileged - مطلوب لقراءة محتوى الرسائل عند الحذف/التعديل
    GatewayIntentBits.GuildVoiceStates // مطلوب لتسجيل أحداث الفويس (دخول/خروج/نقل/كتم...)
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

// تهيئة Logger API مرة واحدة فقط - أي ملف آخر يستورده مباشرة دون تمريره يدوياً
logger.init(client, config.logger, config.branding);

const modules = discoverModules();
const findModule = (name) => modules.find((m) => m.name === name);

// القيم الافتراضية لحالة الأنظمة عند أول تشغيل فقط - بعد ذلك /dashboard هو المتحكم الوحيد،
// ويُحفظ كل تغيير في data/toggles.json دون لمس أي ملف كونفيج وبدون إعادة تشغيل.
const toggleDefaults = {
  "welcome.enabled": findModule("welcome")?.enabledByDefault ?? config.welcome.enabled,
  "welcome.dm.enabled": config.welcome.dm.enabled,
  "welcome.goodbye.enabled": config.welcome.goodbye.enabled,
  "welcome.autoRole.enabled": config.welcome.autoRole.enabled,
  "logger.enabled": findModule("logger")?.enabledByDefault ?? config.logger.enabled,
  "logger.member.enabled": config.logger.member.enabled,
  "logger.message.enabled": config.logger.message.enabled,
  "logger.general.enabled": config.logger.general.enabled,
  "logger.voice.enabled": config.logger.voice.enabled,
  "logger.system.enabled": config.logger.system.enabled,
  "protection.enabled": config.protection.enabled
};

features.load(toggleDefaults);

// السياق المشترك الذي يصل لكل الأحداث والموديولات
const context = { client, bus, config, env };

loadEvents(client, context);
loadModules(modules, context);

if (env.databaseUrl) {
  database.initDatabase(env.databaseUrl);
  database.health().then((result) => devLog.success(`[Database] PostgreSQL ${result.ok ? "connected" : "connection failed"}`));
} else {
  devLog.warn("[Database] DATABASE_URL is not configured; using local storage until PostgreSQL is connected.");
}

process.on("SIGTERM", async () => { await database.close(); process.exit(0); });

process.on("unhandledRejection", (error) => {
  devLog.error(`Unhandled Rejection: ${error?.message || error}`);
  logger.system("error", { title: "🔴 Unhandled Rejection", description: String(error?.stack || error), colorKey: "danger" });
});

process.on("uncaughtException", (error) => {
  devLog.error(`Uncaught Exception: ${error?.message || error}`);
  logger.system("error", { title: "🔴 Uncaught Exception", description: String(error?.stack || error), colorKey: "danger" });
});

client.login(env.token).catch((err) => {
  devLog.error(`فشل تسجيل الدخول: ${err.message}`);
  process.exit(1);
});
