const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildMemberUpdate,
  execute(oldMember, newMember, ctx) {
    // تغيير الاسم (Nickname)
    if (oldMember.nickname !== newMember.nickname) {
      ctx.bus.emit("member:nicknameChange", { oldMember, newMember });
    }

    // فرق الرولات
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter((r) => !oldRoles.has(r.id));
    const removedRoles = oldRoles.filter((r) => !newRoles.has(r.id));

    if (addedRoles.size > 0) {
      ctx.bus.emit("member:roleAdded", { member: newMember, roles: [...addedRoles.values()] });
    }

    if (removedRoles.size > 0) {
      ctx.bus.emit("member:roleRemoved", { member: newMember, roles: [...removedRoles.values()] });
    }

    // Timeout (Communication Disabled Until)
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;
    const now = Date.now();

    const wasTimedOut = oldTimeout && oldTimeout > now;
    const isTimedOut = newTimeout && newTimeout > now;

    if (isTimedOut && oldTimeout !== newTimeout) {
      ctx.bus.emit("member:timeout", { member: newMember, until: newTimeout });
    } else if (wasTimedOut && !isTimedOut) {
      ctx.bus.emit("member:timeoutRemoved", { member: newMember });
    }
  }
};
