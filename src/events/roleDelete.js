const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildRoleDelete,
  execute(role, ctx) {
    ctx.bus.emit("role:delete", role);
  }
};
