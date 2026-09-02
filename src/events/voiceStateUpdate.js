const { Events } = require("discord.js");

module.exports = {
  name: Events.VoiceStateUpdate,
  execute(oldState, newState, ctx) {
    const member = newState.member || oldState.member;
    if (!member) return;

    // دخول روم صوتي (لم يكن في أي روم قبل ذلك)
    if (!oldState.channelId && newState.channelId) {
      ctx.bus.emit("voice:join", { member, channel: newState.channel });
    }
    // خروج من الفويس بالكامل (قد يكون طوعياً أو Disconnect بواسطة مسؤول - يُحدَّد لاحقاً عبر Audit Log)
    else if (oldState.channelId && !newState.channelId) {
      ctx.bus.emit("voice:leave", { member, channel: oldState.channel });
    }
    // انتقال من روم صوتي لآخر (طوعياً أو Move بواسطة مسؤول - يُحدَّد لاحقاً عبر Audit Log)
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      ctx.bus.emit("voice:move", { member, oldChannel: oldState.channel, newChannel: newState.channel });
    }

    // كتم/إلغاء كتم من قِبل مسؤول (Server Mute) - يختلف عن كتم العضو لنفسه (Self Mute)
    if (oldState.serverMute !== newState.serverMute) {
      ctx.bus.emit(newState.serverMute ? "voice:serverMute" : "voice:serverUnmute", {
        member,
        channel: newState.channel || oldState.channel
      });
    }

    // إسكات/إلغاء إسكات من قِبل مسؤول (Server Deafen)
    if (oldState.serverDeaf !== newState.serverDeaf) {
      ctx.bus.emit(newState.serverDeaf ? "voice:serverDeafen" : "voice:serverUndeafen", {
        member,
        channel: newState.channel || oldState.channel
      });
    }

    // بدء/إيقاف مشاركة الشاشة (Streaming)
    if (oldState.streaming !== newState.streaming) {
      ctx.bus.emit(newState.streaming ? "voice:streamStart" : "voice:streamEnd", {
        member,
        channel: newState.channel || oldState.channel
      });
    }

    // تشغيل/إيقاف الكاميرا
    if (oldState.selfVideo !== newState.selfVideo) {
      ctx.bus.emit(newState.selfVideo ? "voice:cameraOn" : "voice:cameraOff", {
        member,
        channel: newState.channel || oldState.channel
      });
    }
  }
};
