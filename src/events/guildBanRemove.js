const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildBanRemove,
  execute(ban, ctx) {
    ctx.bus.emit("member:unban", ban);
  }
};
