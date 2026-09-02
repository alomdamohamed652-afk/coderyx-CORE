const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildMemberRemove,
  execute(member, ctx) {
    ctx.bus.emit("member:leave", member);
  }
};
