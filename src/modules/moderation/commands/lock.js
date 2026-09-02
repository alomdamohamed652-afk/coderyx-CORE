const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");

const data = new SlashCommandBuilder()
  .setName("lock")
  .setDescription("قفل الروم (منع @everyone من الكتابة)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((opt) =>
    opt.setName("channel").setDescription("الروم المطلوب قفله (افتراضي: الروم الحالي)").addChannelTypes(ChannelType.GuildText)
  )
  .addStringOption((opt) => opt.setName("reason").setDescription("السبب"));

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Manage Channels.", ephemeral: true });
  }

  const channel = interaction.options.getChannel("channel") || interaction.channel;
  const reason = interaction.options.getString("reason") || undefined;

  await interaction.deferReply({ ephemeral: true });

  try {
    pendingActions.record(`channelUpdate:${channel.id}`, { executor: interaction.user, reason });
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason });
    await interaction.editReply({ content: `🔒 تم قفل ${channel}.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ ماقدرتش أقفل الروم: ${err.message}` });
  }
}

module.exports = { data, execute };
