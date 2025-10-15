import type { EmailTemplate } from "./types.js";

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  welcome: {
    name: "welcome",
    subject: {
      en: "Welcome to Safee Analytics",
      ar: "مرحباً بك في Safee Analytics",
    },
    html: {
      en: `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: Arial, sans-serif;">
  <h1>Welcome {{userName}}!</h1>
  <p>Thank you for registering with Safee Analytics.</p>
  <p>You can now start using the platform to manage your business.</p>
</body>
</html>`,
      ar: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right;">
  <h1>!مرحباً {{userName}}</h1>
  <p>.شكراً لتسجيلك في Safee Analytics</p>
  <p>.يمكنك الآن البدء في استخدام المنصة لإدارة أعمالك</p>
</body>
</html>`,
    },
    requiredVariables: ["userName"],
  },
  password_reset: {
    name: "password_reset",
    subject: {
      en: "Password Reset",
      ar: "إعادة تعيين كلمة المرور",
    },
    html: {
      en: `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: Arial, sans-serif;">
  <h1>Password Reset</h1>
  <p>You requested to reset your password.</p>
  <p>Click the link below to reset your password:</p>
  <a href="{{resetLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
  <p>This link will expire in 1 hour.</p>
</body>
</html>`,
      ar: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right;">
  <h1>إعادة تعيين كلمة المرور</h1>
  <p>.لقد طلبت إعادة تعيين كلمة المرور الخاصة بك</p>
  <p>:انقر على الرابط أدناه لإعادة تعيين كلمة المرور</p>
  <a href="{{resetLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">إعادة تعيين كلمة المرور</a>
  <p>.سينتهي هذا الرابط خلال ساعة واحدة</p>
</body>
</html>`,
    },
    requiredVariables: ["resetLink"],
  },
  invoice: {
    name: "invoice",
    subject: {
      en: "Invoice #{{invoiceNumber}}",
      ar: "فاتورة رقم {{invoiceNumber}}",
    },
    html: {
      en: `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: Arial, sans-serif;">
  <h1>New Invoice</h1>
  <p>Please find attached your invoice #{{invoiceNumber}}.</p>
  <p>Thank you for your business.</p>
</body>
</html>`,
      ar: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right;">
  <h1>فاتورة جديدة</h1>
  <p>.نرسل لك فاتورة رقم {{invoiceNumber}}</p>
  <p>.يمكنك العثور على الفاتورة المرفقة بهذا البريد الإلكتروني</p>
</body>
</html>`,
    },
    requiredVariables: ["invoiceNumber"],
  },
} as const;

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES;
