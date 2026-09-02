const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType
} = require("discord.js");
const { buildEmbed } = require("./embedBuilder");
const { hasPermission } = require("./permissions");
const features = require("./features");
const commandRegistry = require("./commandRegistry");
const dashboardPanel = require("./dashboardPanel");
const devLog = require("./devLogger");

/**
 * هذه القائمة هي المصدر الوحيد لعناصر الـ Dashboard.
 * كل عنصر يطابق مفتاحاً في features.js (Toggle Store).
 */
const TOGGLES = [
  { key: "welcome.enabled", label: "Welcome System" },
  { key: "logger.enabled", label: "Logger System" },
  { key: "welcome.autoRole.enabled", label: "Auto Role" },
  { key: "welcome.dm.enabled", label: "Welcome DM" },
  { key: "welcome.goodbye.enabled", label: "Goodbye" },
  { key: "logger.member.enabled", label: "Member Logs" },
  { key: "logger.message.enabled", label: "Message Logs" },
  { key: "logger.general.enabled", label: "General Logs" },
  { key: "logger.voice.enabled", label: "Voice Logs" },
  { key: "logger.system.enabled", label: "System Logs" }
];

function buildDashboardPayload(branding) {
  const description = TOGGLES.map((t) => `${features.get(t.key) ? "🟢" : "🔴"}  ${t.label}`).join("\n");

  const embed = buildEmbed(branding, { title: "⚙️ Dashboard", description });

  const rows = [];
  for (let i = 0; i < TOGGLES.length; i += 4) {
    const group = TOGGLES.slice(i, i + 4);
    rows.push(
      new ActionRowBuilder().addComponents(
        group.map((t) =>
          new ButtonBuilder()
            .setCustomId(`dashboard:${t.key}`)
            .setLabel(t.label)
            .setStyle(features.get(t.key) ? ButtonStyle.Success : ButtonStyle.Secondary)
        )
      )
    );
  }

  return { embeds: [embed], components: rows };
}

/**
 * يحدّث لوحة التحكم الدائمة (لو موجودة) - يُستدعى بعد أي تبديل، حتى لو التبديل حصل من
 * /dashboard view عند شخص آخر، لضمان أن اللوحة الثابتة تعكس دائماً الحالة الحقيقية.
 */
async function syncPanel(client, branding, justUpdatedMessageId) {
  const panel = dashboardPanel.get();
  if (!panel) return;
  if (panel.messageId === justUpdatedMessageId) return; // اللوحة هي نفسها اللي اتحدثت بالفعل

  try {
    const channel = await client.channels.fetch(panel.channelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(panel.messageId).catch(() => null);
    if (!message) return;

    await message.edit(buildDashboardPayload(branding));
  } catch (err) {
    devLog.warn(`[Dashboard] تعذّر تحديث اللوحة الدائمة: ${err.message}`);
  }
}

async function handlePanelCommand(interaction, { config }) {
  const channel = interaction.options.getChannel("channel") || interaction.channel;

  try {
    const sent = await channel.send(buildDashboardPayload(config.branding));
    dashboardPanel.set({ channelId: channel.id, messageId: sent.id });

    await interaction.reply({
      content: `✅ تم تثبيت لوحة التحكم في ${channel} - هتتحدث تلقائياً مع أي تغيير من أي مكان.`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({ content: `❌ حصل خطأ: ${err.message}`, ephemeral: true });
  }
}

async function handleCommand(interaction, ctx) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: "❌ هذا الأمر متاح فقط لمن يملك صلاحية Manage Server.", ephemeral: true });
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "panel") {
    return handlePanelCommand(interaction, ctx);
  }

  await interaction.reply({ ...buildDashboardPayload(ctx.config.branding), ephemeral: true });
}

async function handleButton(interaction, { client, config }) {
  if (!hasPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: "❌ ليس لديك صلاحية تنفيذ هذا الإجراء.", ephemeral: true });
  }

  const key = interaction.customId.replace("dashboard:", "");
  features.set(key, !features.get(key));

  await interaction.update(buildDashboardPayload(config.branding));
  await syncPanel(client, config.branding, interaction.message.id);
}

const commandData = new SlashCommandBuilder()
  .setName("dashboard")
  .setDescription("عرض وإدارة حالة أنظمة البوت (تفعيل/تعطيل فوري دون إعادة تشغيل)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) => sub.setName("view").setDescription("عرض سريع لحالة الأنظمة (يظهر لك فقط)"))
  .addSubcommand((sub) =>
    sub
      .setName("panel")
      .setDescription("تثبيت لوحة تحكم دائمة في روم معيّن (تظهر للجميع وتتحدث تلقائياً)")
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("الروم (افتراضي: الروم الحالي)").addChannelTypes(ChannelType.GuildText)
      )
  );

commandRegistry.register(commandData, handleCommand);

module.exports = { TOGGLES, buildDashboardPayload, handleCommand, handleButton, commandData };
