const { buildEmbed } = require("./embedBuilder");
const features = require("./features");
const guildFeatures = require("./guildFeatures");
const devLog = require("./devLogger");
let _client, _config, _branding;
function init(client, loggerConfig, branding) { _client=client; _config=loggerConfig; _branding=branding; }
async function resolveChannel(sectionConfig) {
  const channelId=sectionConfig?.channelId || _config?.fallbackChannelId;
  if(!channelId || !_client) return null;
  let channel=_client.channels.cache.get(channelId);
  if(!channel) channel=await _client.channels.fetch(channelId).catch(()=>null);
  return channel || null;
}
function isEnabled(category,eventKey,guildId=null) {
  const id=guildId?.id || guildId;
  if(id) {
    if(!guildFeatures.isEnabled(id,"logger",features.get("logger.enabled")===true)) return false;
    if(!guildFeatures.isEnabled(id,"logger."+category,features.get("logger."+category+".enabled")===true)) return false;
  } else {
    if(!features.get("logger.enabled")) return false;
    if(!features.get("logger."+category+".enabled")) return false;
  }
  if(eventKey) { const sectionConfig=_config?.[category]; if(sectionConfig?.events && sectionConfig.events[eventKey]===false) return false; }
  return true;
}
async function send(category,eventKey,options={},guild) {
  if(!isEnabled(category,eventKey,guild)) return;
  const sectionConfig=_config?.[category];
  const eventChannelId=sectionConfig?.eventChannels?.[eventKey];
  const channel=eventChannelId ? await resolveChannel({...sectionConfig,channelId:eventChannelId}) : await resolveChannel(sectionConfig);
  if(!channel?.isTextBased?.()) { devLog.warn("[Logger] لا توجد قناة نصية صالحة لقسم \"" + category + "\"."); return; }
  try { const embed=buildEmbed(_branding,{...options,guild}); await channel.send({embeds:[embed]}); }
  catch(err) { devLog.error("[Logger] فشل إرسال لوج \"" + category + "." + eventKey + "\": " + (err?.stack || err)); }
}
module.exports={init,isEnabled,member:(e,o,g)=>send("member",e,o,g),message:(e,o,g)=>send("message",e,o,g),general:(e,o,g)=>send("general",e,o,g),voice:(e,o,g)=>send("voice",e,o,g),system:(e,o,g)=>send("system",e,o,g)};