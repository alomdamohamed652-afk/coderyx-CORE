const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildEmojiCreate,
  execute(emoji, ctx) {
    ctx.bus.emit("emoji:create", emoji);
  }
};
