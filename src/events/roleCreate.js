const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildRoleCreate,
  execute(role, ctx) {
    ctx.bus.emit("role:create", role);
  }
};
