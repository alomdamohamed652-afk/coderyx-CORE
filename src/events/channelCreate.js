const { Events } = require("discord.js");

module.exports = {
  name: Events.ChannelCreate,
  execute(channel, ctx) {
    ctx.bus.emit("channel:create", channel);
  }
};
