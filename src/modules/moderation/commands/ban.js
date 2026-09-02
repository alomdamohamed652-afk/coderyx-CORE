const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");

const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("حظر عضو من السيرفر")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption((opt) => opt.setName("user").setDescription("العضو المطلوب حظره").setRequired(true))
  .addStringOption((opt) => opt.setName("reason").setDescription("سبب الحظر"))
  .addIntegerOption((opt) =>
    opt.setName("delete_days").setDescription("حذف رسائل آخر كام يوم (0-7)").setMinValue(0).setMaxValue(7)
  );

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.BanMembers)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Ban Members.", ephemeral: true });
  }

  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason") || undefined;
  const deleteDays = interaction.options.getInteger("delete_days") || 0;

  await interaction.deferReply({ ephemeral: true });

  try {
    pendingActions.record(`ban:${user.id}`, { executor: interaction.user, reason });
    await interaction.guild.members.ban(user, { reason, deleteMessageSeconds: deleteDays * 86400 });
    await interaction.editReply({ content: `✅ تم حظر ${user.tag}.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ ماقدرتش أحظر العضو: ${err.message}` });
  }
}

module.exports = { data, execute };
