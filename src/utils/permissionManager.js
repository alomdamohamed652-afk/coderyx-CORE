const { PermissionFlagsBits } = require("discord.js");

function has(member, permission) {
  return Boolean(member?.permissions?.has(permission));
}

function isOwner(member) {
  return Boolean(member?.guild?.ownerId && member.id === member.guild.ownerId);
}

function canModerate(actor, target) {
  if (!actor || !target || actor.id === target.id) return false;
  if (isOwner(target)) return false;
  if (isOwner(actor)) return true;
  return Boolean(actor.roles?.highest && target.roles?.highest &&
    actor.roles.highest.comparePositionTo(target.roles.highest) > 0);
}

function botCanModerate(guild, target) {
  const me = guild?.members?.me;
  if (!me || !target || target.id === guild.ownerId) return false;
  return Boolean(me.roles?.highest && target.roles?.highest &&
    me.roles.highest.comparePositionTo(target.roles.highest) > 0);
}

module.exports = { has, isOwner, canModerate, botCanModerate, PermissionFlagsBits };
