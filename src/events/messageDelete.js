const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageDelete,
  execute(message, ctx) {
    if (message.partial) return; // محتوى الرسالة غير متاح (لم تكن موجودة في الكاش)
    if (message.author?.bot) return; // تجاهل رسائل البوتات

    ctx.bus.emit("message:delete", message);
  }
};
