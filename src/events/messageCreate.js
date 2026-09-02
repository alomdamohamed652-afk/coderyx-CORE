const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message, ctx) {
    ctx.bus.emit("message:create", message);
  }
};
