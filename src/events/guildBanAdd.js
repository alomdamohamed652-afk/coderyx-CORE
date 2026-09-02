const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildBanAdd,
  execute(ban, ctx) {
    ctx.bus.emit("member:ban", ban);
  }
};
