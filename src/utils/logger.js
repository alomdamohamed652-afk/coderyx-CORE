const { buildEmbed } = require("./embedBuilder");
const features = require("./features");
const devLog = require("./devLogger");

let _client, _config, _branding;

/**
 * يُستدعى مرة واحدة من src/index.js قبل تحميل الموديولات.
 */
function init(client, loggerConfig, branding) {
  _client = client;
  _config = loggerConfig;
  _branding = branding;
}

async function resolveChannel(sectionConfig) {
  const channelId = sectionConfig?.channelId || _config.fallbackChannelId;
  if (!channelId) return null;

  let channel = _client.channels.cache.get(channelId);
  if (!channel) channel = await _client.channels.fetch(channelId).catch(() => null);

  return channel || null;
}

/**
 * يسمح لأي Handler بالتحقق المبكر قبل عمل أي شيء مكلف (مثل قراءة Audit Log) - حتى لا
 * يُنفَّذ أي عمل فعلي لحدث يخص Module أو قسم معطّل (توفير في الموارد + استدعاءات API).
 */
function isEnabled(category, eventKey) {
  if (!features.get("logger.enabled")) return false;
  if (!features.get(`logger.${category}.enabled`)) return false;

  if (eventKey) {
    const sectionConfig = _config?.[category];
    if (sectionConfig?.events && sectionConfig.events[eventKey] === false) return false;
  }

  return true;
}

/**
 * Logger API الموحد - أي Module يستدعي logger.member()/message()/general()/system() فقط.
 * هذا الملف مسؤول عن: بناء الإيمبيد (عبر embedBuilder)، اختيار القناة الصحيحة (مع fallback)،
 * وإرسال الرسالة. لا يحتاج أي Module لمعرفة شيء عن القنوات أو الإيمبيدات.
 */
async function send(category, eventKey, options = {}, guild) {
  if (!isEnabled(category, eventKey)) return;

  const sectionConfig = _config[category];
  const channel = await resolveChannel(sectionConfig);
  if (!channel) {
    devLog.warn(`[Logger] لا توجد قناة صالحة لقسم "${category}" (تحقق من channelId أو fallbackChannelId).`);
    return;
  }

  const embed = buildEmbed(_branding, { ...options, guild });

  channel.send({ embeds: [embed] }).catch((err) => {
    devLog.error(`[Logger] فشل إرسال لوج "${category}.${eventKey}": ${err.message}`);
  });
}

module.exports = {
  init,
  isEnabled,
  member: (eventKey, options, guild) => send("member", eventKey, options, guild),
  message: (eventKey, options, guild) => send("message", eventKey, options, guild),
  general: (eventKey, options, guild) => send("general", eventKey, options, guild),
  voice: (eventKey, options, guild) => send("voice", eventKey, options, guild),
  system: (eventKey, options, guild) => send("system", eventKey, options, guild)
};
