export function generateMagicLinkEmailHTML(url: string): string {
  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Magic Link Sign In - Safee Analytics</title>
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
                            <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Sign In to Your Account</h2>
                            <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                                Click the button below to securely sign in to your Safee Analytics account. This link will expire in 15 minutes.
                            </p>

                            <!-- Sign In Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${url}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);">
                                            Sign In to Safee Analytics
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                If you didn't request this sign-in link, please ignore this email. Your account remains secure.
                            </p>

                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>

                            <p style="margin: 0; padding: 12px; background-color: #f9fafb; border-radius: 6px; word-break: break-all; font-size: 12px; color: #4b5563;">
                                ${url}
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

export function generateMagicLinkEmailText(url: string): string {
  return `
Sign In to Your Account - Safee Analytics

Click the link below to securely sign in to your Safee Analytics account. This link will expire in 15 minutes.

${url}

If you didn't request this sign-in link, please ignore this email. Your account remains secure.

© ${new Date().getFullYear()} Safee Analytics. All rights reserved.
  `.trim();
}
