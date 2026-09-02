/**
 * Placeholder Helper موحد - يستخدمه أي نظام حالي أو مستقبلي بدلاً من تكرار منطق الاستبدال.
 * المتاح حالياً: {user} {mention} {server} {memberCount} {username} {userTag} {userid} {joinedAt}
 */
function applyPlaceholders(text, { member, guild } = {}) {
  if (!text || typeof text !== "string") return text;

  const resolvedGuild = guild || member?.guild;
  const mention = member ? member.toString() : "";

  const replacements = {
    "{user}": mention,
    "{mention}": mention,
    "{username}": member ? member.user.username : "",
    "{userTag}": member ? member.user.tag : "",
    "{userid}": member ? member.user.id : "",
    "{joinedAt}": member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "",
    "{server}": resolvedGuild ? resolvedGuild.name : "",
    "{memberCount}": resolvedGuild ? String(resolvedGuild.memberCount) : ""
  };

  let result = text;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.split(placeholder).join(value);
  }

  return result;
}

module.exports = { applyPlaceholders };
