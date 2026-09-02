const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageBulkDelete,
  execute(messages, channel, ctx) {
    ctx.bus.emit("message:bulkDelete", { messages, channel });
  }
};
