export function generateOTPEmailHTML(
  otp: string,
  type: "sign-in" | "email-verification" | "forgot-password" | "forget-password",
): string {
  let purpose: string;
  let title: string;

  if (type === "sign-in") {
    purpose = "sign in to your account";
    title = "Sign In Verification";
  } else if (type === "email-verification") {
    purpose = "verify your email address";
    title = "Email Verification";
  } else {
    purpose = "reset your password";
    title = "Password Reset";
  }

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Safee Analytics</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 48px 40px 32px 40px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 12px 12px 0 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <img src="${process.env.EMAIL_LOGO_URL ?? `${process.env.FRONTEND_URL ?? ""}/safee-logo.png`}" alt="Safee Analytics" style="height: 48px; width: auto; margin-bottom: 16px;" />
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Safee Analytics</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 48px;">
                            <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${title}</h2>
                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                                Use the following verification code to ${purpose}:
                            </p>

                            <!-- OTP Code -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #059669; border-radius: 12px; margin: 0 0 32px 0;">
                                <tr>
                                    <td align="center" style="padding: 32px 24px;">
                                        <div style="font-size: 40px; font-weight: 800; color: #047857; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; text-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                            ${otp}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
                            </p>

                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                For security reasons, never share this code with anyone.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 18px; text-align: center;">
                                &copy; ${new Date().getFullYear()} Safee Analytics. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

export function generateOTPEmailText(
  otp: string,
  type: "sign-in" | "email-verification" | "forgot-password" | "forget-password",
): string {
  let purpose: string;
  let title: string;

  if (type === "sign-in") {
    purpose = "sign in to your account";
    title = "Sign In Verification";
  } else if (type === "email-verification") {
    purpose = "verify your email address";
    title = "Email Verification";
  } else {
    purpose = "reset your password";
    title = "Password Reset";
  }

  return `
${title} - Safee Analytics

Use the following verification code to ${purpose}:

${otp}

This code will expire in 10 minutes. If you didn't request this code, please ignore this email.

For security reasons, never share this code with anyone.

© ${new Date().getFullYear()} Safee Analytics. All rights reserved.
  `.trim();
}
