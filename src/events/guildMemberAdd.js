const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildMemberAdd,
  execute(member, ctx) {
    ctx.bus.emit("member:join", member);
  }
};
