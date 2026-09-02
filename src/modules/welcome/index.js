const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { buildEmbed } = require("../../utils/embedBuilder");
const { applyPlaceholders } = require("../../utils/placeholders");
const features = require("../../utils/features");
const guildFeatures = require("../../utils/guildFeatures");
const devLog = require("../../utils/devLogger");

/**
 * "userAvatar" و "serverIcon" قيم خاصة داخل config/welcome.js تُحل إلى رابط صورة فعلي هنا.
 * أي رابط مباشر آخر يُستخدم كما هو. فاضي = بدون صورة.
 */
function resolveImage(value, member, guild) {
  if (!value) return undefined;
  if (value === "userAvatar") return member.user.displayAvatarURL({ size: 256 });
  if (value === "serverIcon") return guild.iconURL({ size: 256 });
  return value;
}

/**
 * أزرار روابط (مثل القوانين/المنتجات/العروض/الشراء) - نفس المنطق يُستخدم لرسالة الروم ورسالة الخاص.
 */
function buildLinkButtons(buttonsConfig) {
  if (!buttonsConfig?.length) return [];

  return [
    new ActionRowBuilder().addComponents(
      buttonsConfig.map((b) => new ButtonBuilder().setLabel(b.label).setStyle(ButtonStyle.Link).setURL(b.url))
    )
  ];
}

/**
 * معلومات العضو التلقائية (تاريخ إنشاء الحساب، تاريخ الانضمام، ترتيبه في السيرفر) - تُعرض كـ Fields
 * منظمة بدل حشرها داخل الوصف، مثل البوتات الاحترافية.
 */
function buildMemberInfoFields(member) {
  return [
    { name: "📅 حساب Discord مُنشأ", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
    { name: "📆 انضم للسيرفر", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
    { name: "🔢 ترتيبه في السيرفر", value: `العضو رقم #${member.guild.memberCount}`, inline: true }
  ];
}

async function sendChannelMessage(member, welcomeConfig, branding) {
  if (!welcomeConfig.message.enabled) return;

  const channelId = welcomeConfig.message.channelId;
  if (!channelId) {
    devLog.warn("[Welcome] لم يتم تحديد channelId لرسالة الترحيب في config/welcome.js");
    return;
  }

  const channel =
    member.guild.channels.cache.get(channelId) || (await member.guild.channels.fetch(channelId).catch(() => null));

  if (!channel) {
    devLog.warn(`[Welcome] لم يتم العثور على روم الترحيب بالآيدي: ${channelId}`);
    return;
  }

  try {
    if (welcomeConfig.message.embed?.enabled) {
      const e = welcomeConfig.message.embed;
      const embed = buildEmbed(branding, {
        title: applyPlaceholders(e.title, { member }),
        description: applyPlaceholders(e.description, { member }),
        color: e.color,
        thumbnail: resolveImage(e.thumbnail, member, member.guild),
        image: resolveImage(e.image, member, member.guild),
        fields: e.showMemberInfo !== false ? buildMemberInfoFields(member) : undefined,
        guild: member.guild
      });

      await channel.send({ embeds: [embed], components: buildLinkButtons(welcomeConfig.message.buttons) });
    } else {
      await channel.send({ content: applyPlaceholders(welcomeConfig.message.plainText, { member }) });
    }
  } catch (err) {
    devLog.error(`[Welcome] فشل إرسال رسالة الترحيب: ${err.message}`);
  }
}

async function sendDirectMessage(member, welcomeConfig, branding) {
  if (!guildFeatures.isEnabled(member.guild.id, "welcome.dm", features.get("welcome.dm.enabled") === true)) return;

  try {
    const e = welcomeConfig.dm.embed;
    const embed = buildEmbed(branding, {
      title: applyPlaceholders(e.title, { member }),
      description: applyPlaceholders(e.description, { member }),
      color: e.color,
      thumbnail: resolveImage(e.thumbnail, member, member.guild),
      image: resolveImage(e.image, member, member.guild),
      guild: member.guild
    });

    await member.send({ embeds: [embed], components: buildLinkButtons(welcomeConfig.dm.buttons) });
  } catch (err) {
    // غالباً العضو مغلق الخاص - لا نعتبره خطأ حرج
    devLog.warn(`[Welcome] تعذّر إرسال رسالة خاصة لـ ${member.user.tag} (قد يكون الخاص مغلقاً).`);
  }
}

async function assignAutoRole(member, welcomeConfig) {
  if (!guildFeatures.isEnabled(member.guild.id, "welcome.autoRole", features.get("welcome.autoRole.enabled") === true)) return;
  if (member.user.bot && welcomeConfig.autoRole.ignoreBots) return;

  const roleId = welcomeConfig.autoRole.roleId;
  if (!roleId) {
    devLog.warn("[Welcome] لم يتم تحديد roleId للرتبة التلقائية في config/welcome.js");
    return;
  }

  try {
    await member.roles.add(roleId);
  } catch (err) {
    devLog.error(`[Welcome] فشل إعطاء الرتبة التلقائية لـ ${member.user.tag}: ${err.message}`);
  }
}

async function sendGoodbyeMessage(member, welcomeConfig, branding) {
  if (!guildFeatures.isEnabled(member.guild.id, "welcome.goodbye", features.get("welcome.goodbye.enabled") === true)) return;

  // لو لم تُحدَّد قناة وداع، تُستخدم نفس روم الترحيب
  const channelId = welcomeConfig.goodbye.channelId || welcomeConfig.message.channelId;
  if (!channelId) {
    devLog.warn("[Welcome] لم يتم تحديد channelId لرسالة الوداع في config/welcome.js");
    return;
  }

  const channel =
    member.guild.channels.cache.get(channelId) || (await member.guild.channels.fetch(channelId).catch(() => null));
  if (!channel) {
    devLog.warn(`[Welcome] لم يتم العثور على روم الوداع بالآيدي: ${channelId}`);
    return;
  }

  try {
    if (welcomeConfig.goodbye.embed?.enabled) {
      const e = welcomeConfig.goodbye.embed;
      const embed = buildEmbed(branding, {
        title: applyPlaceholders(e.title, { member }),
        description: applyPlaceholders(e.description, { member }),
        color: e.color,
        thumbnail: resolveImage(e.thumbnail, member, member.guild),
        image: resolveImage(e.image, member, member.guild),
        guild: member.guild
      });
      await channel.send({ embeds: [embed] });
    } else {
      await channel.send({ content: applyPlaceholders(welcomeConfig.goodbye.plainText, { member }) });
    }
  } catch (err) {
    devLog.error(`[Welcome] فشل إرسال رسالة الوداع: ${err.message}`);
  }
}

module.exports = {
  name: "welcome",
  version: "1.1.0",
  description: "الترحيب بالأعضاء الجدد (رسالة احترافية + DM + Auto Role) ورسالة الوداع عند الخروج",
  enabledByDefault: true,
  dependencies: [],

  init({ bus, config }) {
    bus.on("member:join", (member) => {
      // المفتاح الرئيسي يتحكم فيه /dashboard ("Welcome System") وقت التشغيل
      if (!guildFeatures.isEnabled(member.guild.id, "welcome", features.get("welcome.enabled") === true)) return;

      sendChannelMessage(member, config.welcome, config.branding);
      sendDirectMessage(member, config.welcome, config.branding);
      assignAutoRole(member, config.welcome);
    });

    bus.on("member:leave", (member) => {
      sendGoodbyeMessage(member, config.welcome, config.branding);
    });
  }
};
