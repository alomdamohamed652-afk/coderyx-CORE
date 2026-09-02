const { PermissionFlagsBits } = require("discord.js");

function hasPermission(member, permissionFlag) {
  return Boolean(member?.permissions?.has(permissionFlag));
}

function hasRole(member, roleId) {
  return Boolean(member?.roles?.cache?.has(roleId));
}

function hasChannelAccess(member, channel) {
  const perms = channel?.permissionsFor?.(member);
  return Boolean(perms?.has(PermissionFlagsBits.ViewChannel));
}

module.exports = { hasPermission, hasRole, hasChannelAccess };
