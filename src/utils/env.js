/**
 * تحميل والتحقق من متغيرات البيئة (.env).
 * دالة بسيطة بدل Class كامل - لا حاجة لحالة داخلية معقدة هنا.
 */
function loadEnv() {
  require("dotenv").config();

  const token = process.env.BOT_TOKEN;

  if (!token || token.includes("YOUR_")) {
    throw new Error("[Env] BOT_TOKEN غير معبأ بشكل صحيح في ملف .env");
  }

  return {
    token,
    clientId: process.env.CLIENT_ID || null,
    guildId: process.env.GUILD_ID || null,
    apiKey: process.env.DASHBOARD_API_KEY || null,
    apiPort: Number(process.env.API_PORT || 3000),
    databaseUrl: process.env.DATABASE_URL || null,
    databaseSsl: process.env.DATABASE_SSL !== "false"
  };
}

module.exports = { loadEnv };
