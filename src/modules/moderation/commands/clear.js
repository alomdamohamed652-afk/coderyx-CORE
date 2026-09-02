const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const pendingActions = require("../../../utils/pendingActions");
const caseManager = require("../../../utils/caseManager");

const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("حذف عدد من الرسائل في الروم الحالي (مع فلاتر اختيارية)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption((opt) =>
    opt.setName("amount").setDescription("عدد الرسائل المطلوب حذفها (1-100، افتراضي 10)").setMinValue(1).setMaxValue(100)
  )
  .addUserOption((opt) => opt.setName("user").setDescription("حذف رسائل عضو معيّن فقط"))
  .addBooleanOption((opt) => opt.setName("bots").setDescription("حذف رسائل البوتات فقط"))
  .addBooleanOption((opt) => opt.setName("links").setDescription("حذف الرسائل التي تحتوي روابط فقط"))
  .addBooleanOption((opt) => opt.setName("attachments").setDescription("حذف الرسائل التي تحتوي ملفات/مرفقات فقط"));

const URL_REGEX = /https?:\/\/\S+/i;

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Manage Messages.", ephemeral: true });
  }

  const channel = interaction.channel;
  if (!channel?.isTextBased()) {
    return interaction.reply({ content: "❌ الأمر ده يُستخدم فقط داخل روم نصي.", ephemeral: true });
  }

  const amount = interaction.options.getInteger("amount") || 10;
  const targetUser = interaction.options.getUser("user");
  const botsOnly = interaction.options.getBoolean("bots");
  const linksOnly = interaction.options.getBoolean("links");
  const attachmentsOnly = interaction.options.getBoolean("attachments");

  await interaction.deferReply({ ephemeral: true });

  try {
    const fetched = await channel.messages.fetch({ limit: 100 });

    const filtered = fetched.filter((msg) => {
      if (targetUser && msg.author.id !== targetUser.id) return false;
      if (botsOnly && !msg.author.bot) return false;
      if (linksOnly && !URL_REGEX.test(msg.content)) return false;
      if (attachmentsOnly && msg.attachments.size === 0) return false;
      return true;
    });

    const toDelete = [...filtered.values()].slice(0, amount);

    if (!toDelete.length) {
      await interaction.editReply({ content: "⚠️ لا توجد رسائل مطابقة للفلاتر المحددة." });
      return;
    }

    const filterParts = [];
    if (targetUser) filterParts.push(`عضو: ${targetUser.tag}`);
    if (botsOnly) filterParts.push("بوتات فقط");
    if (linksOnly) filterParts.push("روابط فقط");
    if (attachmentsOnly) filterParts.push("مرفقات فقط");
    const reason = filterParts.length ? `/clear (${filterParts.join(", ")})` : "/clear";

    if (toDelete.length === 1) {
      // Discord's bulk-delete endpoint يحتاج رسالتين على الأقل - رسالة واحدة تُحذف بالطريقة العادية
      pendingActions.record(`messageDelete:${toDelete[0].id}`, { executor: interaction.user, reason });
      await toDelete[0].delete();
      caseManager.create({ guildId: interaction.guildId, action: "clear", target: targetUser, moderator: interaction.user, reason, source: "command" });
      await interaction.editReply({ content: "✅ تم حذف رسالة واحدة." });
      return;
    }

    pendingActions.record(`bulkDelete:${channel.id}`, { executor: interaction.user, reason });
    const deleted = await channel.bulkDelete(toDelete, true);

    caseManager.create({ guildId: interaction.guildId, action: "clear", target: targetUser, moderator: interaction.user, reason, source: "command" });
    await interaction.editReply({ content: `✅ تم حذف ${deleted.size} رسالة.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ حصل خطأ أثناء الحذف: ${err.message}` });
  }
}

module.exports = { data, execute };
