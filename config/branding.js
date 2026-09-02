/**
 * ============================================
 *  Branding Configuration
 *  كل شيء يخص الهوية البصرية يُعدَّل من هنا فقط - ولا يوجد أي لون أو Footer أو Logo
 *  مكتوب داخل أي Module. كل الإيمبيدات في المشروع تخرج بهذه الهوية تلقائياً عبر
 *  src/utils/embedBuilder.js
 * ============================================
 */

module.exports = {
  // اسم البراند - يُستخدم كاحتياط في أي مكان لا يوجد فيه سيرفر محدد (مثل System Logs)
  brandName: "Codryx",

  // نص الفوتر الافتراضي لجميع الإيمبيدات (يدعم {server})
  footerText: "{server} • Core Management System",

  // شعار يظهر كأيقونة صغيرة بجوار نص الفوتر
  logoUrl: "",

  // صورة Thumbnail افتراضية تُستخدم فقط إن لم يحدد الإيمبيد صورة خاصة به (مثل صورة العضو)
  defaultThumbnail: "",

  // Author يظهر في أعلى كل إيمبيد (اتركه name: "" لتعطيله بالكامل)
  author: {
    name: "",
    iconURL: ""
  },

  // اللون الافتراضي لجميع الإيمبيدات (Hex)
  embedColor: "#2C2F33",

  // لوحة ألوان موحدة يستخدمها أي Module عبر colorKey بدل كتابة Hex يدوياً
  colors: {
    success: "#43B581",
    danger: "#F04747",
    warning: "#FAA61A",
    info: "#5865F2"
  }
};
