module.exports = {
  enabled: false,
  channelId: "",
  action: "timeout",
  timeoutMs: 10 * 60 * 1000,
  deleteMessage: true,
  reason: "Protected channel violation",
  exemptBots: true,
  exemptUsers: [],
  exemptRoles: []
};
