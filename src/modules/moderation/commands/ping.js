const { SlashCommandBuilder } = require("discord.js");
const { buildEmbed } = require("../../../utils/embedBuilder");

const data = new SlashCommandBuilder().setName("ping").setDescription("قياس سرعة استجابة البوت");

async function execute(interaction, ctx) {
  const sent = await interaction.reply({ content: "🏓 جاري القياس...", fetchReply: true });
  const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;
  const wsHeartbeat = Math.round(ctx.client.ws.ping);

  const embed = buildEmbed(ctx.config.branding, {
    title: "🏓 Pong!",
    fields: [
      { name: "زمن الاستجابة (Round Trip)", value: `${roundTrip}ms`, inline: true },
      { name: "Heartbeat (WebSocket)", value: `${wsHeartbeat}ms`, inline: true }
    ],
    colorKey: "info",
    guild: interaction.guild
  });

  await interaction.editReply({ content: null, embeds: [embed] });
}

module.exports = { data, execute };
