const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");

const data = new SlashCommandBuilder()
  .setName("unlock")
  .setDescription("فتح الروم (السماح لـ @everyone بالكتابة)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((opt) =>
    opt.setName("channel").setDescription("الروم المطلوب فتحه (افتراضي: الروم الحالي)").addChannelTypes(ChannelType.GuildText)
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
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }, { reason });
    await interaction.editReply({ content: `🔓 تم فتح ${channel}.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ ماقدرتش أفتح الروم: ${err.message}` });
  }
}

module.exports = { data, execute };
