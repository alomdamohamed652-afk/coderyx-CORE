/**
 * ============================================
 *  Welcome System Configuration
 *  Placeholders المتاحة: {user} {mention} {server} {memberCount} {username} {userTag} {userid} {joinedAt}
 * ============================================
 */

module.exports = {
  // تشغيل/إيقاف نظام الترحيب بالكامل - هذه القيمة تُستخدم كافتراضي عند أول تشغيل فقط.
  // بعد ذلك يتم التحكم بها مباشرة من أمر /dashboard (دون تعديل هذا الملف ودون إعادة تشغيل).
  enabled: true,

  // ------------------------------------------
  // رسالة الترحيب داخل السيرفر
  // ------------------------------------------

  message: {
    enabled: true,

    // روم الترحيب
    channelId: "1516205204750733423",

    embed: {
      enabled: true,

      title: "🎉 أهلاً وسهلاً بك في {server}",

      description:
`مرحباً بك {user} 💙

━━━━━━━━━━━━━━━━━━━━━━━

👤 **مرحباً بانضمامك إلينا!**

📝 الاسم: **{username}**

👥 أنت العضو رقم: **#{memberCount}**

🆔 **الـ ID:** {userid}

📥 **تاريخ الانضمام:** {joinedAt}

━━━━━━━━━━━━━━━━━━━━━━━

📋 **قبل أن تبدأ**

✅ اقرأ جميع القوانين.

✅ تصفح جميع المنتجات.

✅ تابع قسم العروض.

✅ افتح تذكرة إذا احتجت أي مساعدة.

━━━━━━━━━━━━━━━━━━━━━━━

💜 نتمنى لك وقتاً ممتعاً داخل **{server}**.`,

      color: null,

      image: "https://raw.githubusercontent.com/alomdamohamed652-afk/coderyx/c25520f475d016ddfcf3128860ff39d5226e3baa/ChatGPT%20Image%20Jun%2027%2C%202026%2C%2010_48_05%20PM.png",

      thumbnail: "userAvatar",

      showMemberInfo: false
    },

    plainText: "أهلاً بك {user} في {server}!",

    buttons: [
      { label: "📜 القوانين", url: "https://discord.com/channels/1516201999488647248/1516205204750733423" },
      { label: "🛒 المنتجات", url: "https://discord.com/channels/1516201999488647248/1519490835593433128" },
      { label: "🔥 العروض", url: "https://discord.com/channels/1516201999488647248/1516205508401299466" },
      { label: "🎫 الشراء", url: "https://discord.com/channels/1516201999488647248/1516205608410284084" }
    ]
  },

  // ------------------------------------------
  // رسالة الخاص
  // ------------------------------------------

  dm: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("Welcome DM")
    enabled: true,

    embed: {
      title: "💜 أهلاً بك في {server}",

      description:
`يسعدنا انضمامك إلينا.

يمكنك البدء من خلال الأزرار الموجودة بالأسفل للوصول سريعاً إلى أهم أقسام السيرفر.

إذا احتجت أي مساعدة فلا تتردد في فتح تذكرة وسنكون سعداء بخدمتك.`,

      color: null,

      thumbnail: "serverIcon",

      image: "https://raw.githubusercontent.com/alomdamohamed652-afk/coderyx/969b282a4c05df3aa08a6dad3fef6289eaa3fd1d/4a7bd051-634b-4a75-a45f-65d6343ab0e6.png"
    },

    buttons: [
      { label: "📜 القوانين", url: "https://discord.com/channels/1516201999488647248/1516205204750733423" },
      { label: "🛒 المنتجات", url: "https://discord.com/channels/1516201999488647248/1519490835593433128" },
      { label: "🔥 العروض", url: "https://discord.com/channels/1516201999488647248/1516205508401299466" },
      { label: "🎫 فتح تذكرة", url: "https://discord.com/channels/1516201999488647248/1516205608410284084" }
    ]
  },
  // ------------------------------------------
  // رسالة الخاص
  // ------------------------------------------

  dm: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("Welcome DM")
    enabled: true,

    embed: {
      title: "💜 أهلاً بك في {server}",

      description:
`يسعدنا انضمامك إلينا.

يمكنك البدء من خلال الأزرار الموجودة بالأسفل للوصول سريعاً إلى أهم أقسام السيرفر.

إذا احتجت أي مساعدة فلا تتردد في فتح تذكرة وسنكون سعداء بخدمتك.`,

      color: null,

      thumbnail: "serverIcon",

      image: "https://raw.githubusercontent.com/alomdamohamed652-afk/coderyx/969b282a4c05df3aa08a6dad3fef6289eaa3fd1d/4a7bd051-634b-4a75-a45f-65d6343ab0e6.png"
    },

    buttons: [
      {
        label: "📜 القوانين",
        url: "https://discord.com/channels/1516201999488647248/1516205225453686855"
      },
      {
        label: "🛒 المنتجات",
        url: "https://discord.com/channels/1516201999488647248/1519490835593433128"
      },
      {
        label: "🔥 العروض",
        url: "https://discord.com/channels/1516201999488647248/1516205508401299466"
      },
      {
        label: "🎫 فتح تذكرة",
        url: "https://discord.com/channels/1516201999488647248/1516205608410284084"
      }
    ]
  },

  // ------------------------------------------
  // رسالة المغادرة
  // ------------------------------------------

  goodbye: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("Goodbye")
    enabled: true,

    // اتركها فاضية لاستخدام نفس روم الترحيب (message.channelId)
    channelId: "1520586389165703390",

    embed: {
      enabled: true,

      title: "👋 وداعاً",

      description:
`غادرنا **{username}**

نتمنى له كل التوفيق، ونتمنى أن نراه مجدداً داخل **{server}**. 💜`,

     color: null,

thumbnail: "userAvatar",

image: "https://raw.githubusercontent.com/alomdamohamed652-afk/coderyx/5325dffa31b99a1c9113ba8b06d1bfab02147066/ChatGPT%20Image%20Jun%2029%2C%202026%2C%2006_17_02%20PM.png"
    },

    plainText: "👋 غادر {username} السيرفر."
  },

  // ------------------------------------------
  // الرتبة التلقائية
  // ------------------------------------------
  autoRole: {
    // افتراضي أول تشغيل فقط - بعدها يتحكم فيه /dashboard ("Auto Role")
    enabled: false,
    roleId: "1516202862508642455",
    ignoreBots: true
  }
};
