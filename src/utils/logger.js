const { buildEmbed } = require("./embedBuilder");
const features = require("./features");
const devLog = require("./devLogger");

let _client, _config, _branding;

function init(client, loggerConfig, branding) {
  _client = client;
  _config = loggerConfig;
  _branding = branding;
}

async function resolveChannel(sectionConfig) {
  const channelId = sectionConfig?.channelId || _config?.fallbackChannelId;
  if (!channelId || !_client) return null;

  let channel = _client.channels.cache.get(channelId);
  if (!channel) channel = await _client.channels.fetch(channelId).catch(() => null);

  return channel || null;
}

function isEnabled(category, eventKey) {
  if (!features.get("logger.enabled")) return false;
  if (!features.get(`logger.${category}.enabled`)) return false;

  if (eventKey) {
    const sectionConfig = _config?.[category];
    if (sectionConfig?.events && sectionConfig.events[eventKey] === false) return false;
  }

  return true;
}

async function send(category, eventKey, options = {}, guild) {
  if (!isEnabled(category, eventKey)) return;

  const sectionConfig = _config?.[category];
  const eventChannelId = sectionConfig?.eventChannels?.[eventKey];
  const channel = eventChannelId
    ? await resolveChannel({ ...sectionConfig, channelId: eventChannelId })
    : await resolveChannel(sectionConfig);
  if (!channel?.isTextBased?.()) {
    devLog.warn(`[Logger] لا توجد قناة نصية صالحة لقسم "${category}".`);
    return;
  }

  try {
    const embed = buildEmbed(_branding, { ...options, guild });
    await channel.send({ embeds: [embed] });
  } catch (err) {
    devLog.error(`[Logger] فشل إرسال لوج "${category}.${eventKey}": ${err?.stack || err}`);
  }
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
