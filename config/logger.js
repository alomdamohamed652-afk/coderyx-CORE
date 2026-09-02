/**
 * ============================================
 *  Logger System Configuration
 *  إذا تُرك channelId فارغاً لأي قسم، تُستخدم fallbackChannelId تلقائياً.
 * ============================================
 */

module.exports = {
  // تشغيل/إيقاف نظام اللوجات بالكامل - افتراضي أول تشغيل فقط، بعدها يتحكم فيه /dashboard
  enabled: true,

  // في حالة عدم تحديد قناة لأي قسم، تذهب جميع لوجاته هنا
  fallbackChannelId: "1520032315886272682",

  // تجاهل أحداث البوتات في لوجات الأعضاء (دخول/خروج/تعديل)
  ignoreBots: false,

  // ------------------------------------------
  // Member Logs
  // ------------------------------------------
  member: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("Member Logs")
    enabled: true,
    channelId: "1520597065279864835", // اتركه فارغاً لاستخدام fallbackChannelId
    events: {
      join: true,
      leave: true,
      ban: true,
      unban: true,
      kick: true,
      timeout: true,
      timeoutRemoved: true,
      nicknameChange: true,
      roleAdded: true,
      roleRemoved: true
    }
  },

  // ------------------------------------------
  // Message Logs
  // ------------------------------------------
  message: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("Message Logs")
    enabled: true,
    channelId: "1520597138269143232",
    events: {
      delete: true,
      edit: true,
      bulkDelete: true
    },
    // تجاهل الرسائل التي تبدأ برموز أوامر شائعة لتقليل الضوضاء (اختياري)
    ignorePrefixes: []
  },

  // ------------------------------------------
  // General Logs
  // ------------------------------------------
  general: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("General Logs")
    enabled: true,
    channelId: "1520597186751103218",
    events: {
      channelCreate: true,
      channelDelete: true,
      channelUpdate: true,
      categoryCreate: true,
      categoryDelete: true,
      roleCreate: true,
      roleDelete: true,
      roleUpdate: true,
      guildUpdate: true, // اسم/أيقونة/Banner/Verification Level/AFK Channel/AFK Timeout - كلها في حدث واحد
      emojiCreate: true,
      emojiDelete: true
    }
  },

  // ------------------------------------------
  // Voice Logs
  // ------------------------------------------
  voice: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("Voice Logs")
    enabled: true,
    channelId: "1520597235568611400",
    events: {
      join: true,
      leave: true,
      move: true, // ينتقل العضو من روم صوتي لآخر بنفسه أو بواسطة Move من مسؤول
      disconnect: true, // فصل العضو من الفويس بواسطة مسؤول
      serverMute: true,
      serverUnmute: true,
      serverDeafen: true,
      serverUndeafen: true,
      streamStart: true,
      streamEnd: true,
      cameraOn: true,
      cameraOff: true
    }
  },

  // ------------------------------------------
  // System Logs
  // ------------------------------------------
  system: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("System Logs")
    enabled: true,
    channelId: "1520597296503586949",
    events: {
      ready: true,
      restart: true,
      error: true,
      warning: true,
      databaseError: true
    }
  }
};
