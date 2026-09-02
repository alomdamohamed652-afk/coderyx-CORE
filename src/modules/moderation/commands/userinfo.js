const { SlashCommandBuilder } = require("discord.js");
const { buildEmbed } = require("../../../utils/embedBuilder");

const data = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("عرض معلومات عن عضو")
  .addUserOption((opt) => opt.setName("user").setDescription("العضو (افتراضي: نفسك)"));

async function execute(interaction, ctx) {
  const targetUser = interaction.options.getUser("user") || interaction.user;
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  const fields = [
    { name: "الاسم الكامل", value: targetUser.tag, inline: true },
    { name: "الآيدي", value: targetUser.id, inline: true },
    { name: "بوت؟", value: targetUser.bot ? "نعم" : "لا", inline: true },
    { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>` }
  ];

  if (member) {
    const roles = member.roles.cache.filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);

    fields.push(
      { name: "تاريخ الانضمام للسيرفر", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` },
      {
        name: `الرولات (${roles.size})`,
        value: roles.size ? roles.map((r) => r.toString()).join(", ").slice(0, 1000) : "بدون رولات"
      }
    );
  }

  const embed = buildEmbed(ctx.config.branding, {
    title: `معلومات ${targetUser.username}`,
    thumbnail: targetUser.displayAvatarURL({ size: 256 }),
    fields,
    colorKey: "info",
    guild: interaction.guild
  });

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };
