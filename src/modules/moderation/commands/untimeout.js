const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");

const data = new SlashCommandBuilder()
  .setName("untimeout")
  .setDescription("إلغاء التقييد (Timeout) عن عضو")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((opt) => opt.setName("user").setDescription("العضو المطلوب إلغاء تقييده").setRequired(true))
  .addStringOption((opt) => opt.setName("reason").setDescription("السبب"));

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Moderate Members.", ephemeral: true });
  }

  const target = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason") || undefined;

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (!member) {
    return interaction.reply({ content: "❌ العضو ده غير موجود في السيرفر.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    pendingActions.record(`untimeout:${target.id}`, { executor: interaction.user, reason });
    await member.timeout(null, reason);
    await interaction.editReply({ content: `✅ تم إلغاء التقييد عن ${target.tag}.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ حصل خطأ: ${err.message}` });
  }
}

module.exports = { data, execute };
