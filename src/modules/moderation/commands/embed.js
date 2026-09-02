const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");
const { hasPermission } = require("../../../utils/permissions");
const { buildEmbed } = require("../../../utils/embedBuilder");

const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("إنشاء أو تعديل إيمبيد مخصص (قوانين، إعلانات، أي محتوى)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand((sub) =>
    sub
      .setName("send")
      .setDescription("إنشاء وإرسال إيمبيد جديد")
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("الروم (افتراضي: الروم الحالي)").addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("edit")
      .setDescription("تعديل إيمبيد أرسله البوت من قبل")
      .addStringOption((opt) => opt.setName("message_id").setDescription("آيدي الرسالة").setRequired(true))
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("الروم (افتراضي: الروم الحالي)").addChannelTypes(ChannelType.GuildText)
      )
  );

function buildModal(customId, isEdit, prefill = {}) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(isEdit ? "تعديل الإيمبيد" : "إنشاء إيمبيد جديد");

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("العنوان (اختياري)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(256);
  if (prefill.title) titleInput.setValue(prefill.title);

  const descInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("المحتوى (القوانين أو أي نص)")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000);
  if (prefill.description) descInput.setValue(prefill.description);

  const colorInput = new TextInputBuilder()
    .setCustomId("color")
    .setLabel("لون الإيمبيد Hex (اختياري - مثل #FF0000)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(7);
  if (prefill.color) colorInput.setValue(prefill.color);

  const imageInput = new TextInputBuilder()
    .setCustomId("image")
    .setLabel("رابط صورة Banner (اختياري)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  if (prefill.image) imageInput.setValue(prefill.image);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(imageInput)
  );

  return modal;
}

function hexFromEmbedColor(colorInt) {
  if (colorInt === null || colorInt === undefined) return "";
  return `#${colorInt.toString(16).padStart(6, "0")}`;
}

async function execute(interaction) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: "❌ لازم يكون معاك صلاحية Manage Messages.", ephemeral: true });
  }

  const subcommand = interaction.options.getSubcommand();
  const channel = interaction.options.getChannel("channel") || interaction.channel;

  if (subcommand === "send") {
    await interaction.showModal(buildModal(`embed_modal:send:${channel.id}`, false));
    return;
  }

  // edit
  const messageId = interaction.options.getString("message_id", true).trim();
  const message = await channel.messages.fetch(messageId).catch(() => null);

  if (!message) {
    return interaction.reply({ content: "❌ ملقتش رسالة بهذا الآيدي في هذا الروم.", ephemeral: true });
  }

  if (message.author.id !== interaction.client.user.id || !message.embeds.length) {
    return interaction.reply({ content: "❌ الرسالة دي مش إيمبيد أرسله البوت - مش هقدر أعدّلها.", ephemeral: true });
  }

  const existing = message.embeds[0];
  const modal = buildModal(`embed_modal:edit:${channel.id}:${messageId}`, true, {
    title: existing.title || "",
    description: existing.description || "",
    color: hexFromEmbedColor(existing.color),
    image: existing.image?.url || ""
  });

  await interaction.showModal(modal);
}

/**
 * يُستدعى من src/events/interactionCreate.js عند إرسال نموذج (Modal) بـ customId يبدأ بـ "embed_modal:"
 */
async function handleModal(interaction, ctx) {
  const [, action, channelId, messageId] = interaction.customId.split(":");

  const title = interaction.fields.getTextInputValue("title")?.trim() || undefined;
  const description = interaction.fields.getTextInputValue("description");
  const colorRaw = interaction.fields.getTextInputValue("color")?.trim();
  const image = interaction.fields.getTextInputValue("image")?.trim() || undefined;

  const color = colorRaw && /^#?[0-9a-fA-F]{6}$/.test(colorRaw) ? (colorRaw.startsWith("#") ? colorRaw : `#${colorRaw}`) : undefined;

  const embed = buildEmbed(ctx.config.branding, { title, description, color, image, guild: interaction.guild });

  const channel =
    interaction.guild.channels.cache.get(channelId) || (await interaction.guild.channels.fetch(channelId).catch(() => null));

  if (!channel) {
    return interaction.reply({ content: "❌ الروم غير موجود.", ephemeral: true });
  }

  try {
    if (action === "send") {
      const sent = await channel.send({ embeds: [embed] });
      await interaction.reply({
        content: `✅ تم إرسال الإيمبيد في ${channel}.\nآيدي الرسالة: \`${sent.id}\` (احتفظ به لو عايز تعدّله بعدين بـ /embed edit)`,
        ephemeral: true
      });
    } else {
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        return interaction.reply({ content: "❌ الرسالة غير موجودة (يمكن تم حذفها).", ephemeral: true });
      }
      await message.edit({ embeds: [embed] });
      await interaction.reply({ content: `✅ تم تعديل الإيمبيد في ${channel}.`, ephemeral: true });
    }
  } catch (err) {
    await interaction.reply({ content: `❌ حصل خطأ: ${err.message}`, ephemeral: true });
  }
}

module.exports = { data, execute, handleModal };
