const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");
const caseManager = require("../../../utils/caseManager");

const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("تقييد عضو (Timeout) لفترة محددة بالدقائق")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((opt) => opt.setName("user").setDescription("العضو المطلوب تقييده").setRequired(true))
  .addIntegerOption((opt) =>
    opt
      .setName("minutes")
      .setDescription("المدة بالدقائق (أقصى حد 40320 = 28 يوم)")
      .setMinValue(1)
      .setMaxValue(40320)
      .setRequired(true)
  )
  .addStringOption((opt) => opt.setName("reason").setDescription("السبب"));

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Moderate Members.", ephemeral: true });
  }

  const target = interaction.options.getUser("user", true);
  const minutes = interaction.options.getInteger("minutes", true);
  const reason = interaction.options.getString("reason") || undefined;

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (!member) {
    return interaction.reply({ content: "❌ العضو ده غير موجود في السيرفر.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    pendingActions.record(`timeout:${target.id}`, { executor: interaction.user, reason });
    await member.timeout(minutes * 60 * 1000, reason);
    caseManager.create({ guildId: interaction.guildId, action: "timeout", target, moderator: interaction.user, reason, duration: minutes * 60, source: "command" });
    await interaction.editReply({ content: `✅ تم تقييد ${target.tag} لمدة ${minutes} دقيقة.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ ماقدرتش أقيّد العضو: ${err.message}` });
  }
}

module.exports = { data, execute };
