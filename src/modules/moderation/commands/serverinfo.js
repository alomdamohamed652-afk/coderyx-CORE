const { SlashCommandBuilder } = require("discord.js");
const { buildEmbed } = require("../../../utils/embedBuilder");

const data = new SlashCommandBuilder().setName("serverinfo").setDescription("عرض معلومات عن السيرفر");

async function execute(interaction, ctx) {
  const guild = interaction.guild;
  const owner = await guild.fetchOwner().catch(() => null);

  const fields = [
    { name: "اسم السيرفر", value: guild.name, inline: true },
    { name: "الآيدي", value: guild.id, inline: true },
    { name: "المالك", value: owner ? owner.user.tag : "غير معروف", inline: true },
    { name: "تاريخ الإنشاء", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>` },
    { name: "عدد الأعضاء", value: `${guild.memberCount}`, inline: true },
    { name: "عدد الرومات", value: `${guild.channels.cache.size}`, inline: true },
    { name: "عدد الرولات", value: `${guild.roles.cache.size}`, inline: true },
    { name: "مستوى Boost", value: `${guild.premiumTier}`, inline: true },
    { name: "عدد Boosts", value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
  ];

  const embed = buildEmbed(ctx.config.branding, {
    title: `معلومات سيرفر ${guild.name}`,
    thumbnail: guild.iconURL({ size: 256 }),
    fields,
    colorKey: "info",
    guild
  });

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };
