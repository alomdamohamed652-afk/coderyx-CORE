const { SlashCommandBuilder } = require("discord.js");
const { buildEmbed } = require("../../../utils/embedBuilder");

const data = new SlashCommandBuilder()
  .setName("avatar")
  .setDescription("عرض صورة عضو بحجم كبير")
  .addUserOption((opt) => opt.setName("user").setDescription("العضو (افتراضي: نفسك)"));

async function execute(interaction, ctx) {
  const targetUser = interaction.options.getUser("user") || interaction.user;

  const embed = buildEmbed(ctx.config.branding, {
    title: `صورة ${targetUser.username}`,
    image: targetUser.displayAvatarURL({ size: 1024 }),
    colorKey: "info",
    guild: interaction.guild
  });

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };
