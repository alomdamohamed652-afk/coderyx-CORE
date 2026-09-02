const { Events } = require("discord.js");

module.exports = {
  name: Events.ChannelDelete,
  execute(channel, ctx) {
    ctx.bus.emit("channel:delete", channel);
  }
};
