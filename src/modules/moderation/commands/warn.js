const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const warnings = require("../../../utils/warnings");

const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("تحذير عضو")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
  .addStringOption(o => o.setName("reason").setDescription("السبب"));

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Moderate Members.", ephemeral: true });
  }
  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason") || "No reason provided";
  const result = warnings.add(interaction.guildId, user, interaction.user, reason);
  const threshold = result.threshold;
  let message = `⚠️ تم تحذير <@${user.id}>. إجمالي التحذيرات: ${result.count}.`;
  if (threshold > 0 && result.count >= threshold) message += " وصل العضو للحد المحدد.";
  return interaction.reply({ content: message });
}
module.exports = { data, execute };
