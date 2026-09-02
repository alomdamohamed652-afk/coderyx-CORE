const { EmbedBuilder } = require("discord.js");

function resolveColor(branding, colorKey, explicitColor) {
  if (explicitColor) return explicitColor;
  if (colorKey && branding.colors?.[colorKey]) return branding.colors[colorKey];
  return branding.embedColor || "#2C2F33";
}

/**
 * منشئ الإيمبيد الموحد.
 *
 * أي Module (حالي أو مستقبلي) يجب أن يستخدم هذه الدالة فقط لإنشاء أي إيمبيد - ولا يبني
 * إيمبيد يدوياً بنفسه. الـ Footer والـ Author والـ Timestamp تأتي دائماً من branding.js
 * ولا يمكن لأي Module تجاوزها، لضمان أن كل إيمبيدات البوت متطابقة في الهوية البصرية.
 *
 * المتاح للتخصيص لكل استدعاء هو فقط المحتوى: title, description, fields, thumbnail, image,
 * واختيار اللون (color مباشر أو colorKey من لوحة ألوان branding.js).
 */
function buildEmbed(branding, { title, description, fields, color, colorKey, thumbnail, image, guild } = {}) {
  const embed = new EmbedBuilder().setColor(resolveColor(branding, colorKey, color)).setTimestamp();

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields?.length) embed.addFields(fields);

  if (thumbnail !== undefined) {
    if (thumbnail) embed.setThumbnail(thumbnail);
  } else if (branding.defaultThumbnail) {
    embed.setThumbnail(branding.defaultThumbnail);
  }

  if (image) embed.setImage(image);

  if (branding.footerText) {
    embed.setFooter({
      text: branding.footerText.split("{server}").join(guild?.name || branding.brandName),
      iconURL: branding.logoUrl || undefined
    });
  }

  if (branding.author?.name) {
    embed.setAuthor({ name: branding.author.name, iconURL: branding.author.iconURL || undefined });
  }

  return embed;
}

module.exports = { buildEmbed };
