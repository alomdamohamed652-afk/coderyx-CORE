const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");
const caseManager = require("../../../utils/caseManager");

const data = new SlashCommandBuilder()
  .setName("slowmode")
  .setDescription("تحديد Slowmode لروم معيّن (بالثواني)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addIntegerOption((opt) =>
    opt
      .setName("seconds")
      .setDescription("المدة بالثواني (0 = إيقاف، أقصى حد 21600 = 6 ساعات)")
      .setMinValue(0)
      .setMaxValue(21600)
      .setRequired(true)
  )
  .addChannelOption((opt) =>
    opt.setName("channel").setDescription("الروم (افتراضي: الروم الحالي)").addChannelTypes(ChannelType.GuildText)
  );

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Manage Channels.", ephemeral: true });
  }

  const seconds = interaction.options.getInteger("seconds", true);
  const channel = interaction.options.getChannel("channel") || interaction.channel;

  await interaction.deferReply({ ephemeral: true });

  try {
    pendingActions.record(`channelUpdate:${channel.id}`, { executor: interaction.user, reason: `/slowmode (${seconds}s)` });
    await channel.setRateLimitPerUser(seconds);

    const message = seconds === 0 ? `✅ تم إيقاف Slowmode في ${channel}.` : `✅ تم تفعيل Slowmode (${seconds} ثانية) في ${channel}.`;
    caseManager.create({ guildId: interaction.guildId, action: "slowmode", target: { id: channel.id, tag: channel.name }, moderator: interaction.user, reason: `/slowmode (${seconds}s)`, source: "command" });
    await interaction.editReply({ content: message });
  } catch (err) {
    await interaction.editReply({ content: `❌ حصل خطأ: ${err.message}` });
  }
}

module.exports = { data, execute };
