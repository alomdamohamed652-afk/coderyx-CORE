const { AuditLogEvent, ChannelType } = require("discord.js");
const loggerApi = require("../../utils/logger");
const { resolveExecutor } = require("../../utils/resolveExecutor");
const { smartDiff } = require("../../utils/textDiff");

let ignoreBots = false;

function shouldIgnore(user) {
  return Boolean(ignoreBots && user?.bot);
}

function truncate(text, max = 1000) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function executorFields(result) {
  return [
    { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "غير معروف", inline: true },
    { name: "السبب (Reason)", value: result.reason || "بدون سبب", inline: true }
  ];
}

const VERIFICATION_LEVELS = {
  0: "بدون (None)",
  1: "منخفض (Low)",
  2: "متوسط (Medium)",
  3: "مرتفع (High)",
  4: "مرتفع جداً (Very High)"
};

// ===================== Member Logs =====================

async function onMemberJoin(member) {
  if (!loggerApi.isEnabled("member", "join")) return;
  if (shouldIgnore(member.user)) return;

  await loggerApi.member(
    "join",
    {
      title: "📥 عضو جديد دخل السيرفر",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member} (\`${member.user.tag}\`)` },
        { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "عدد الأعضاء الحالي", value: `${member.guild.memberCount}`, inline: true }
      ],
      colorKey: "success"
    },
    member.guild
  );
}

async function onMemberLeave(member) {
  if (!loggerApi.isEnabled("member", "leave")) return;
  if (shouldIgnore(member.user)) return;

  // الخروج الطوعي و الطرد (Kick) كلاهما يفعّلان نفس الحدث - نحدد عبر pendingActions (لو من أمر /kick) أو Audit Log
  const result = await resolveExecutor({
    pendingKey: `kick:${member.id}`,
    guild: member.guild,
    auditType: AuditLogEvent.MemberKick,
    targetId: member.id
  });

  if (result.executor) {
    await loggerApi.member(
      "kick",
      {
        title: "👢 تم طرد عضو",
        thumbnail: member.user.displayAvatarURL(),
        fields: [{ name: "العضو (المستهدف)", value: `${member.user.tag} (\`${member.user.id}\`)` }, ...executorFields(result)],
        colorKey: "danger"
      },
      member.guild
    );
    return;
  }

  await loggerApi.member(
    "leave",
    {
      title: "📤 عضو غادر السيرفر",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member.user.tag} (\`${member.user.id}\`)` },
        { name: "عدد الأعضاء الحالي", value: `${member.guild.memberCount}`, inline: true }
      ],
      colorKey: "danger"
    },
    member.guild
  );
}

async function onMemberBan(ban) {
  if (!loggerApi.isEnabled("member", "ban")) return;

  const result = await resolveExecutor({
    pendingKey: `ban:${ban.user.id}`,
    guild: ban.guild,
    auditType: AuditLogEvent.MemberBanAdd,
    targetId: ban.user.id
  });

  await loggerApi.member(
    "ban",
    {
      title: "🔨 تم حظر عضو",
      thumbnail: ban.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${ban.user.tag} (\`${ban.user.id}\`)` },
        { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "غير معروف", inline: true },
        { name: "السبب (Reason)", value: ban.reason || result.reason || "بدون سبب", inline: true }
      ],
      colorKey: "danger"
    },
    ban.guild
  );
}

async function onMemberUnban(ban) {
  if (!loggerApi.isEnabled("member", "unban")) return;

  const result = await resolveExecutor({
    pendingKey: `unban:${ban.user.id}`,
    guild: ban.guild,
    auditType: AuditLogEvent.MemberBanRemove,
    targetId: ban.user.id
  });

  await loggerApi.member(
    "unban",
    {
      title: "🟢 تم إلغاء حظر عضو",
      thumbnail: ban.user.displayAvatarURL(),
      fields: [{ name: "العضو (المستهدف)", value: `${ban.user.tag} (\`${ban.user.id}\`)` }, ...executorFields(result)],
      colorKey: "success"
    },
    ban.guild
  );
}

async function onMemberTimeout({ member, until }) {
  if (!loggerApi.isEnabled("member", "timeout")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({
    pendingKey: `timeout:${member.id}`,
    guild: member.guild,
    auditType: AuditLogEvent.MemberUpdate,
    targetId: member.id,
    extraCheck: (e) => e.changes?.some((c) => c.key === "communication_disabled_until")
  });

  await loggerApi.member(
    "timeout",
    {
      title: "⏱️ تم تقييد عضو (Timeout)",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member} (\`${member.user.tag}\`)` },
        { name: "ينتهي في", value: `<t:${Math.floor(until / 1000)}:R>`, inline: true },
        ...executorFields(result)
      ],
      colorKey: "warning"
    },
    member.guild
  );
}

async function onMemberTimeoutRemoved({ member }) {
  if (!loggerApi.isEnabled("member", "timeoutRemoved")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({
    pendingKey: `untimeout:${member.id}`,
    guild: member.guild,
    auditType: AuditLogEvent.MemberUpdate,
    targetId: member.id,
    extraCheck: (e) => e.changes?.some((c) => c.key === "communication_disabled_until")
  });

  await loggerApi.member(
    "timeoutRemoved",
    {
      title: "✅ تم رفع التقييد عن عضو",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member} (\`${member.user.tag}\`)` },
        { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "انتهت المدة تلقائياً", inline: true }
      ],
      colorKey: "success"
    },
    member.guild
  );
}

async function onNicknameChange({ oldMember, newMember }) {
  if (!loggerApi.isEnabled("member", "nicknameChange")) return;
  if (shouldIgnore(newMember.user)) return;

  const result = await resolveExecutor({
    guild: newMember.guild,
    auditType: AuditLogEvent.MemberUpdate,
    targetId: newMember.id,
    extraCheck: (e) => e.changes?.some((c) => c.key === "nick")
  });

  await loggerApi.member(
    "nicknameChange",
    {
      title: "✏️ تم تغيير اسم عضو",
      thumbnail: newMember.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${newMember}` },
        { name: "الاسم القديم", value: oldMember.displayName || "—", inline: true },
        { name: "الاسم الجديد", value: newMember.displayName || "—", inline: true },
        { name: "المنفذ (Executor)", value: result.executor?.tag || "العضو نفسه", inline: true }
      ],
      colorKey: "info"
    },
    newMember.guild
  );
}

async function onRoleAdded({ member, roles }) {
  if (!loggerApi.isEnabled("member", "roleAdded")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({ guild: member.guild, auditType: AuditLogEvent.MemberRoleUpdate, targetId: member.id });

  await loggerApi.member(
    "roleAdded",
    {
      title: "➕ تمت إضافة رول لعضو",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}` },
        { name: "الرول", value: roles.map((r) => r.toString()).join(", ") },
        { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "غير معروف", inline: true }
      ],
      colorKey: "success"
    },
    member.guild
  );
}

async function onRoleRemoved({ member, roles }) {
  if (!loggerApi.isEnabled("member", "roleRemoved")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({ guild: member.guild, auditType: AuditLogEvent.MemberRoleUpdate, targetId: member.id });

  await loggerApi.member(
    "roleRemoved",
    {
      title: "➖ تمت إزالة رول من عضو",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}` },
        { name: "الرول", value: roles.map((r) => r.toString()).join(", ") },
        { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "غير معروف", inline: true }
      ],
      colorKey: "danger"
    },
    member.guild
  );
}

// ===================== Message Logs =====================

async function onMessageDelete(message) {
  if (!loggerApi.isEnabled("message", "delete")) return;

  const result = message.author
    ? await resolveExecutor({
        pendingKey: `messageDelete:${message.id}`,
        guild: message.guild,
        auditType: AuditLogEvent.MessageDelete,
        targetId: message.author.id,
        extraCheck: (e) => e.extra?.channel?.id === message.channel.id
      })
    : { executor: null, reason: null };

  await loggerApi.message(
    "delete",
    {
      title: "🗑️ تم حذف رسالة",
      fields: [
        { name: "صاحب الرسالة (المستهدف)", value: message.author?.tag || "غير معروف", inline: true },
        { name: "الروم", value: `${message.channel}`, inline: true },
        { name: "المنفذ (Executor)", value: result.executor?.tag || "صاحب الرسالة نفسه", inline: true },
        { name: "السبب (Reason)", value: result.reason || "بدون سبب", inline: true },
        { name: "محتوى الرسالة", value: truncate(message.content) }
      ],
      colorKey: "danger"
    },
    message.guild
  );
}

async function onMessageEdit({ oldMessage, newMessage }) {
  if (!loggerApi.isEnabled("message", "edit")) return;

  await loggerApi.message(
    "edit",
    {
      title: "✏️ تم تعديل رسالة",
      fields: [
        { name: "صاحب الرسالة", value: newMessage.author?.tag || "غير معروف", inline: true },
        { name: "الروم", value: `${newMessage.channel}`, inline: true },
        { name: "الفرق (Diff)", value: smartDiff(oldMessage.content, newMessage.content) }
      ],
      colorKey: "warning"
    },
    newMessage.guild
  );
}

async function onBulkDelete({ messages, channel }) {
  if (!loggerApi.isEnabled("message", "bulkDelete")) return;

  const result = await resolveExecutor({
    pendingKey: `bulkDelete:${channel.id}`,
    guild: channel.guild,
    auditType: AuditLogEvent.MessageBulkDelete,
    targetId: channel.id
  });

  await loggerApi.message(
    "bulkDelete",
    {
      title: "🧹 تم حذف عدة رسائل (Bulk Delete)",
      fields: [
        { name: "الروم (المستهدف)", value: `${channel}`, inline: true },
        { name: "عدد الرسائل المحذوفة", value: `${messages.size}`, inline: true },
        ...executorFields(result)
      ],
      colorKey: "danger"
    },
    channel.guild
  );
}

// ===================== General Logs =====================

function diffOverwrites(oldMap, newMap, guild) {
  const lines = [];
  const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);

  for (const id of allIds) {
    const oldOw = oldMap.get(id);
    const newOw = newMap.get(id);
    const target = guild.roles.cache.get(id)?.toString() || `<@${id}>`;

    if (!oldOw && newOw) {
      lines.push(`➕ Overwrite جديد لـ ${target}`);
      continue;
    }
    if (oldOw && !newOw) {
      lines.push(`➖ تمت إزالة Overwrite لـ ${target}`);
      continue;
    }
    if (oldOw.allow.bitfield === newOw.allow.bitfield && oldOw.deny.bitfield === newOw.deny.bitfield) continue;

    const addedAllow = newOw.allow.toArray().filter((p) => !oldOw.allow.has(p));
    const addedDeny = newOw.deny.toArray().filter((p) => !oldOw.deny.has(p));
    const reset = [...oldOw.allow.toArray(), ...oldOw.deny.toArray()].filter(
      (p) => !newOw.allow.has(p) && !newOw.deny.has(p)
    );

    const parts = [];
    if (addedAllow.length) parts.push(`✅ ${addedAllow.join(", ")}`);
    if (addedDeny.length) parts.push(`❌ ${addedDeny.join(", ")}`);
    if (reset.length) parts.push(`↩️ ${reset.join(", ")}`);

    if (parts.length) lines.push(`${target}: ${parts.join(" | ")}`);
  }

  return lines;
}

async function onChannelCreate(channel) {
  const isCategory = channel.type === ChannelType.GuildCategory;
  const eventKey = isCategory ? "categoryCreate" : "channelCreate";
  if (!loggerApi.isEnabled("general", eventKey)) return;

  const result = await resolveExecutor({ guild: channel.guild, auditType: AuditLogEvent.ChannelCreate, targetId: channel.id });

  await loggerApi.general(
    eventKey,
    {
      title: isCategory ? "📁 تم إنشاء Category" : "📌 تم إنشاء روم",
      thumbnail: result.executor?.displayAvatarURL?.(),
      fields: [{ name: "الاسم (المستهدف)", value: channel.name }, ...executorFields(result)],
      colorKey: "success"
    },
    channel.guild
  );
}

async function onChannelDelete(channel) {
  const isCategory = channel.type === ChannelType.GuildCategory;
  const eventKey = isCategory ? "categoryDelete" : "channelDelete";
  if (!loggerApi.isEnabled("general", eventKey)) return;

  const result = await resolveExecutor({ guild: channel.guild, auditType: AuditLogEvent.ChannelDelete, targetId: channel.id });

  await loggerApi.general(
    eventKey,
    {
      title: isCategory ? "📁 تم حذف Category" : "📌 تم حذف روم",
      thumbnail: result.executor?.displayAvatarURL?.(),
      fields: [{ name: "الاسم (المستهدف)", value: channel.name }, ...executorFields(result)],
      colorKey: "danger"
    },
    channel.guild
  );
}

async function onChannelUpdate({ oldChannel, newChannel }) {
  if (!loggerApi.isEnabled("general", "channelUpdate")) return;

  const fields = [{ name: "الروم (المستهدف)", value: `${newChannel}` }];

  if (oldChannel.name !== newChannel.name) {
    fields.push(
      { name: "الاسم القديم", value: oldChannel.name, inline: true },
      { name: "الاسم الجديد", value: newChannel.name, inline: true }
    );
  }

  if (oldChannel.topic !== newChannel.topic) {
    fields.push(
      { name: "الـ Topic القديم", value: oldChannel.topic || "—", inline: true },
      { name: "الـ Topic الجديد", value: newChannel.topic || "—", inline: true }
    );
  }

  if (oldChannel.nsfw !== newChannel.nsfw) {
    fields.push({ name: "NSFW", value: newChannel.nsfw ? "تم التفعيل ✅" : "تم الإيقاف ❌", inline: true });
  }

  if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
    fields.push(
      { name: "Slowmode القديم", value: `${oldChannel.rateLimitPerUser || 0} ثانية`, inline: true },
      { name: "Slowmode الجديد", value: `${newChannel.rateLimitPerUser || 0} ثانية`, inline: true }
    );
  }

  if (oldChannel.parentId !== newChannel.parentId) {
    fields.push(
      { name: "الفئة القديمة", value: oldChannel.parent?.name || "بدون فئة", inline: true },
      { name: "الفئة الجديدة", value: newChannel.parent?.name || "بدون فئة", inline: true }
    );
  }

  const overwriteDiff = diffOverwrites(oldChannel.permissionOverwrites.cache, newChannel.permissionOverwrites.cache, newChannel.guild);
  if (overwriteDiff.length) {
    fields.push({ name: "تغييرات الصلاحيات (Permissions)", value: truncate(overwriteDiff.join("\n")) });
  }

  const result = await resolveExecutor({
    pendingKey: `channelUpdate:${newChannel.id}`,
    guild: newChannel.guild,
    auditType: AuditLogEvent.ChannelUpdate,
    targetId: newChannel.id
  });

  fields.push(...executorFields(result));

  await loggerApi.general(
    "channelUpdate",
    {
      title: "🔧 تم تعديل روم",
      thumbnail: result.executor?.displayAvatarURL?.(),
      fields,
      colorKey: "info"
    },
    newChannel.guild
  );
}

async function onRoleCreate(role) {
  if (!loggerApi.isEnabled("general", "roleCreate")) return;

  const result = await resolveExecutor({ guild: role.guild, auditType: AuditLogEvent.RoleCreate, targetId: role.id });

  await loggerApi.general(
    "roleCreate",
    {
      title: "🏷️ تم إنشاء رول",
      thumbnail: result.executor?.displayAvatarURL?.(),
      fields: [{ name: "الرول (المستهدف)", value: `${role}` }, ...executorFields(result)],
      colorKey: "success"
    },
    role.guild
  );
}

async function onRoleDelete(role) {
  if (!loggerApi.isEnabled("general", "roleDelete")) return;

  const result = await resolveExecutor({ guild: role.guild, auditType: AuditLogEvent.RoleDelete, targetId: role.id });

  await loggerApi.general(
    "roleDelete",
    {
      title: "🏷️ تم حذف رول",
      thumbnail: result.executor?.displayAvatarURL?.(),
      fields: [{ name: "الرول (المستهدف)", value: role.name }, ...executorFields(result)],
      colorKey: "danger"
    },
    role.guild
  );
}

async function onRoleUpdate({ oldRole, newRole }) {
  if (!loggerApi.isEnabled("general", "roleUpdate")) return;

  const fields = [{ name: "الرول (المستهدف)", value: `${newRole}` }];

  if (oldRole.name !== newRole.name) {
    fields.push(
      { name: "الاسم القديم", value: oldRole.name, inline: true },
      { name: "الاسم الجديد", value: newRole.name, inline: true }
    );
  }

  if (oldRole.hexColor !== newRole.hexColor) {
    fields.push(
      { name: "اللون القديم", value: oldRole.hexColor, inline: true },
      { name: "اللون الجديد", value: newRole.hexColor, inline: true }
    );
  }

  if (oldRole.position !== newRole.position) {
    fields.push(
      { name: "الترتيب القديم", value: `${oldRole.position}`, inline: true },
      { name: "الترتيب الجديد", value: `${newRole.position}`, inline: true }
    );
  }

  if (oldRole.hoist !== newRole.hoist) {
    fields.push({
      name: "الظهور المنفصل في قائمة الأعضاء",
      value: newRole.hoist ? "أصبح يظهر منفصلاً ✅" : "لم يعد يظهر منفصلاً ❌",
      inline: true
    });
  }

  if (oldRole.mentionable !== newRole.mentionable) {
    fields.push({
      name: "إمكانية المنشن",
      value: newRole.mentionable ? "أصبح قابلاً للمنشن ✅" : "لم يعد قابلاً للمنشن ❌",
      inline: true
    });
  }

  const addedPerms = newRole.permissions.toArray().filter((p) => !oldRole.permissions.has(p));
  const removedPerms = oldRole.permissions.toArray().filter((p) => !newRole.permissions.has(p));

  if (addedPerms.length) fields.push({ name: "صلاحيات تمت إضافتها", value: addedPerms.join(", ") });
  if (removedPerms.length) fields.push({ name: "صلاحيات تمت إزالتها", value: removedPerms.join(", ") });

  const result = await resolveExecutor({ guild: newRole.guild, auditType: AuditLogEvent.RoleUpdate, targetId: newRole.id });
  fields.push(...executorFields(result));

  await loggerApi.general(
    "roleUpdate",
    { title: "🔧 تم تعديل رول", thumbnail: result.executor?.displayAvatarURL?.(), fields, colorKey: "info" },
    newRole.guild
  );
}

async function onGuildUpdate({ oldGuild, newGuild }) {
  if (!loggerApi.isEnabled("general", "guildUpdate")) return;

  const fields = [];
  let thumbnail;
  let image;

  if (oldGuild.name !== newGuild.name) {
    fields.push(
      { name: "الاسم القديم", value: oldGuild.name, inline: true },
      { name: "الاسم الجديد", value: newGuild.name, inline: true }
    );
  }

  if (oldGuild.icon !== newGuild.icon) {
    thumbnail = newGuild.iconURL({ size: 256 }) || undefined;
    fields.push({ name: "الأيقونة", value: "تم تغيير أيقونة السيرفر", inline: true });
  }

  if (oldGuild.banner !== newGuild.banner) {
    image = newGuild.bannerURL({ size: 512 }) || undefined;
    fields.push({ name: "Banner", value: "تم تغيير Banner السيرفر", inline: true });
  }

  if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
    fields.push(
      { name: "Verification Level القديم", value: VERIFICATION_LEVELS[oldGuild.verificationLevel] ?? `${oldGuild.verificationLevel}`, inline: true },
      { name: "Verification Level الجديد", value: VERIFICATION_LEVELS[newGuild.verificationLevel] ?? `${newGuild.verificationLevel}`, inline: true }
    );
  }

  if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
    fields.push(
      { name: "AFK Channel القديم", value: oldGuild.afkChannel?.name || "بدون", inline: true },
      { name: "AFK Channel الجديد", value: newGuild.afkChannel?.name || "بدون", inline: true }
    );
  }

  if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
    fields.push(
      { name: "AFK Timeout القديم", value: `${oldGuild.afkTimeout} ثانية`, inline: true },
      { name: "AFK Timeout الجديد", value: `${newGuild.afkTimeout} ثانية`, inline: true }
    );
  }

  if (!fields.length) return;

  const result = await resolveExecutor({ guild: newGuild, auditType: AuditLogEvent.GuildUpdate, targetId: newGuild.id });
  fields.push(...executorFields(result));

  await loggerApi.general(
    "guildUpdate",
    { title: "🏠 تم تعديل إعدادات السيرفر", thumbnail, image, fields, colorKey: "info" },
    newGuild
  );
}

async function onEmojiCreate(emoji) {
  if (!loggerApi.isEnabled("general", "emojiCreate")) return;

  const result = await resolveExecutor({ guild: emoji.guild, auditType: AuditLogEvent.EmojiCreate, targetId: emoji.id });

  await loggerApi.general(
    "emojiCreate",
    {
      title: "😀 تم إضافة Emoji",
      thumbnail: emoji.imageURL(),
      fields: [{ name: "الاسم (المستهدف)", value: emoji.name }, ...executorFields(result)],
      colorKey: "success"
    },
    emoji.guild
  );
}

async function onEmojiDelete(emoji) {
  if (!loggerApi.isEnabled("general", "emojiDelete")) return;

  const result = await resolveExecutor({ guild: emoji.guild, auditType: AuditLogEvent.EmojiDelete, targetId: emoji.id });

  await loggerApi.general(
    "emojiDelete",
    {
      title: "😀 تم حذف Emoji",
      fields: [{ name: "الاسم (المستهدف)", value: emoji.name }, ...executorFields(result)],
      colorKey: "danger"
    },
    emoji.guild
  );
}

// ===================== Voice Logs =====================

async function onVoiceJoin({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "join")) return;
  if (shouldIgnore(member.user)) return;

  await loggerApi.voice(
    "join",
    {
      title: "🔊 عضو دخل روم صوتي",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: `${channel}`, inline: true }
      ],
      colorKey: "success"
    },
    member.guild
  );
}

async function onVoiceLeave({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "leave")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({
    guild: member.guild,
    auditType: AuditLogEvent.MemberDisconnect,
    targetId: member.id,
    predicate: (e) => !e.extra?.channel?.id || e.extra.channel.id === channel?.id
  });

  if (result.executor) {
    await loggerApi.voice(
      "disconnect",
      {
        title: "🔌 تم فصل عضو من الفويس",
        thumbnail: member.user.displayAvatarURL(),
        fields: [{ name: "العضو (المستهدف)", value: `${member}`, inline: true }, { name: "الروم", value: `${channel}`, inline: true }, ...executorFields(result)],
        colorKey: "danger"
      },
      member.guild
    );
    return;
  }

  await loggerApi.voice(
    "leave",
    {
      title: "🔇 عضو غادر روم صوتي",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: `${channel}`, inline: true }
      ],
      colorKey: "danger"
    },
    member.guild
  );
}

async function onVoiceMove({ member, oldChannel, newChannel }) {
  if (!loggerApi.isEnabled("voice", "move")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({ guild: member.guild, auditType: AuditLogEvent.MemberMove,
    targetId: member.id,
    predicate: (e) => !e.extra?.channel?.id || e.extra.channel.id === newChannel?.id
  });

  await loggerApi.voice(
    "move",
    {
      title: result.executor ? "↔️ تم نقل عضو بين الرومات الصوتية" : "↔️ عضو انتقل بين الرومات الصوتية",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "من", value: `${oldChannel}`, inline: true },
        { name: "إلى", value: `${newChannel}`, inline: true },
        ...(result.executor ? executorFields(result) : [])
      ],
      colorKey: "info"
    },
    member.guild
  );
}

async function onVoiceServerMute({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "serverMute")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({
    guild: member.guild,
    auditType: AuditLogEvent.MemberUpdate,
    targetId: member.id,
    extraCheck: (e) => e.changes?.some((c) => c.key === "mute" && c.new === true)
  });

  await loggerApi.voice(
    "serverMute",
    {
      title: "🔈 تم كتم عضو في الفويس (Server Mute)",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: channel ? `${channel}` : "—", inline: true },
        { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "غير معروف", inline: true }
      ],
      colorKey: "warning"
    },
    member.guild
  );
}

async function onVoiceServerUnmute({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "serverUnmute")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({
    guild: member.guild,
    auditType: AuditLogEvent.MemberUpdate,
    targetId: member.id,
    extraCheck: (e) => e.changes?.some((c) => c.key === "mute" && c.new === false)
  });

  await loggerApi.voice(
    "serverUnmute",
    {
      title: "🔊 تم إلغاء كتم عضو في الفويس",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: channel ? `${channel}` : "—", inline: true },
        { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "غير معروف", inline: true }
      ],
      colorKey: "success"
    },
    member.guild
  );
}

async function onVoiceServerDeafen({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "serverDeafen")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({
    guild: member.guild,
    auditType: AuditLogEvent.MemberUpdate,
    targetId: member.id,
    extraCheck: (e) => e.changes?.some((c) => c.key === "deaf" && c.new === true)
  });

  await loggerApi.voice(
    "serverDeafen",
    {
      title: "🔇 تم إسكات عضو في الفويس (Server Deafen)",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: channel ? `${channel}` : "—", inline: true },
        { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "غير معروف", inline: true }
      ],
      colorKey: "warning"
    },
    member.guild
  );
}

async function onVoiceServerUndeafen({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "serverUndeafen")) return;
  if (shouldIgnore(member.user)) return;

  const result = await resolveExecutor({
    guild: member.guild,
    auditType: AuditLogEvent.MemberUpdate,
    targetId: member.id,
    extraCheck: (e) => e.changes?.some((c) => c.key === "deaf" && c.new === false)
  });

  await loggerApi.voice(
    "serverUndeafen",
    {
      title: "🔊 تم إلغاء إسكات عضو في الفويس",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: channel ? `${channel}` : "—", inline: true },
        { name: "المنفذ (Executor)", value: result.executor ? `<@${result.executor.id}>` : "غير معروف", inline: true }
      ],
      colorKey: "success"
    },
    member.guild
  );
}

async function onVoiceStreamStart({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "streamStart")) return;
  if (shouldIgnore(member.user)) return;

  await loggerApi.voice(
    "streamStart",
    {
      title: "🖥️ عضو بدأ مشاركة الشاشة",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: channel ? `${channel}` : "—", inline: true }
      ],
      colorKey: "info"
    },
    member.guild
  );
}

async function onVoiceStreamEnd({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "streamEnd")) return;
  if (shouldIgnore(member.user)) return;

  await loggerApi.voice(
    "streamEnd",
    {
      title: "🖥️ عضو أوقف مشاركة الشاشة",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: channel ? `${channel}` : "—", inline: true }
      ],
      colorKey: "info"
    },
    member.guild
  );
}

async function onVoiceCameraOn({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "cameraOn")) return;
  if (shouldIgnore(member.user)) return;

  await loggerApi.voice(
    "cameraOn",
    {
      title: "📷 عضو شغّل الكاميرا",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: channel ? `${channel}` : "—", inline: true }
      ],
      colorKey: "info"
    },
    member.guild
  );
}

async function onVoiceCameraOff({ member, channel }) {
  if (!loggerApi.isEnabled("voice", "cameraOff")) return;
  if (shouldIgnore(member.user)) return;

  await loggerApi.voice(
    "cameraOff",
    {
      title: "📷 عضو أوقف الكاميرا",
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "العضو (المستهدف)", value: `${member}`, inline: true },
        { name: "الروم", value: channel ? `${channel}` : "—", inline: true }
      ],
      colorKey: "info"
    },
    member.guild
  );
}

// ===================== System Logs =====================

async function onSystemReady(client) {
  if (!loggerApi.isEnabled("system", "ready")) return;

  await loggerApi.system("ready", {
    title: "🟢 تم تشغيل البوت",
    fields: [{ name: "البوت", value: client.user.tag }],
    colorKey: "success"
  });
}

module.exports = {
  name: "logger",
  version: "2.0.0",
  description: "تسجيل كل الأحداث المهمة في السيرفر (أعضاء، رسائل، عام، فويس، نظام) مع تحديد المنفّذ دائماً",
  enabledByDefault: true,
  dependencies: [],

  init({ bus, config }) {
    ignoreBots = Boolean(config.logger.ignoreBots);

    bus.on("member:join", onMemberJoin);
    bus.on("member:leave", onMemberLeave);
    bus.on("member:ban", onMemberBan);
    bus.on("member:unban", onMemberUnban);
    bus.on("member:timeout", onMemberTimeout);
    bus.on("member:timeoutRemoved", onMemberTimeoutRemoved);
    bus.on("member:nicknameChange", onNicknameChange);
    bus.on("member:roleAdded", onRoleAdded);
    bus.on("member:roleRemoved", onRoleRemoved);

    bus.on("message:delete", onMessageDelete);
    bus.on("message:edit", onMessageEdit);
    bus.on("message:bulkDelete", onBulkDelete);

    bus.on("channel:create", onChannelCreate);
    bus.on("channel:delete", onChannelDelete);
    bus.on("channel:update", onChannelUpdate);
    bus.on("role:create", onRoleCreate);
    bus.on("role:delete", onRoleDelete);
    bus.on("role:update", onRoleUpdate);
    bus.on("guild:update", onGuildUpdate);
    bus.on("emoji:create", onEmojiCreate);
    bus.on("emoji:delete", onEmojiDelete);

    bus.on("voice:join", onVoiceJoin);
    bus.on("voice:leave", onVoiceLeave);
    bus.on("voice:move", onVoiceMove);
    bus.on("voice:serverMute", onVoiceServerMute);
    bus.on("voice:serverUnmute", onVoiceServerUnmute);
    bus.on("voice:serverDeafen", onVoiceServerDeafen);
    bus.on("voice:serverUndeafen", onVoiceServerUndeafen);
    bus.on("voice:streamStart", onVoiceStreamStart);
    bus.on("voice:streamEnd", onVoiceStreamEnd);
    bus.on("voice:cameraOn", onVoiceCameraOn);
    bus.on("voice:cameraOff", onVoiceCameraOff);

    bus.on("system:ready", onSystemReady);
  }
};
