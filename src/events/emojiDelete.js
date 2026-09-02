const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildEmojiDelete,
  execute(emoji, ctx) {
    ctx.bus.emit("emoji:delete", emoji);
  }
};
