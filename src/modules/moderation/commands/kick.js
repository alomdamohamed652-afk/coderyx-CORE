const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");
const caseManager = require("../../../utils/caseManager");

const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("طرد عضو من السيرفر")
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption((opt) => opt.setName("user").setDescription("العضو المطلوب طرده").setRequired(true))
  .addStringOption((opt) => opt.setName("reason").setDescription("سبب الطرد"));

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.KickMembers)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Kick Members.", ephemeral: true });
  }

  const target = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason") || undefined;

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (!member) {
    return interaction.reply({ content: "❌ العضو ده غير موجود في السيرفر.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    pendingActions.record(`kick:${target.id}`, { executor: interaction.user, reason });
    await member.kick(reason);
    caseManager.create({ guildId: interaction.guildId, action: "kick", target, moderator: interaction.user, reason, source: "command" });
    await interaction.editReply({ content: `✅ تم طرد ${target.tag}.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ ماقدرتش أطرد العضو: ${err.message}` });
  }
}

module.exports = { data, execute };
