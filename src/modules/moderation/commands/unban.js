const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");
const caseManager = require("../../../utils/caseManager");

const data = new SlashCommandBuilder()
  .setName("unban")
  .setDescription("إلغاء حظر عضو عن طريق آيدي الحساب")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addStringOption((opt) => opt.setName("user_id").setDescription("آيدي العضو المطلوب إلغاء حظره").setRequired(true))
  .addStringOption((opt) => opt.setName("reason").setDescription("سبب إلغاء الحظر"));

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.BanMembers)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Ban Members.", ephemeral: true });
  }

  const userId = interaction.options.getString("user_id", true).trim();
  const reason = interaction.options.getString("reason") || undefined;

  if (!/^\d{15,21}$/.test(userId)) {
    return interaction.reply({ content: "❌ آيدي غير صالح - لازم يكون رقم العضو (Snowflake) فقط.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    pendingActions.record(`unban:${userId}`, { executor: interaction.user, reason });
    await interaction.guild.members.unban(userId, reason);
    caseManager.create({ guildId: interaction.guildId, action: "unban", target: { id: userId }, moderator: interaction.user, reason, source: "command" });
    await interaction.editReply({ content: `✅ تم إلغاء حظر العضو (${userId}).` });
  } catch (err) {
    await interaction.editReply({ content: `❌ ماقدرتش ألغي الحظر: ${err.message}` });
  }
}

module.exports = { data, execute };
