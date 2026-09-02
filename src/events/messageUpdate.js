const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageUpdate,
  execute(oldMessage, newMessage, ctx) {
    if (oldMessage.partial || newMessage.partial) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // تجاهل تحديثات لا تخص النص (مثل تحميل Embed)

    ctx.bus.emit("message:edit", { oldMessage, newMessage });
  }
};
