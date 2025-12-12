/**
 * Email Verification Template
 * Sent when a user needs to verify their email address
 */

interface EmailVerificationData {
  userName: string;
  verificationUrl: string;
  expiresIn?: string;
}

export function generateEmailVerificationHTML(data: EmailVerificationData): string {
  const { userName, verificationUrl, expiresIn = "24 hours" } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 600;">Verify Your Email Address</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 24px;">Hi ${userName},</p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 24px;">
                Thanks for signing up for Safee Analytics! To complete your registration, please verify your email address by clicking the button below:
              </p>

              <!-- Verify Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify Email Address</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                This verification link will expire in ${expiresIn}. After verification, you'll have full access to your Safee Analytics account.
              </p>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; color: #2563eb; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f0f9ff;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 20px;">
                      💡 <strong>Didn't sign up?</strong> If you didn't create an account with Safee Analytics, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 18px; text-align: center;">
                This email was sent by Safee Analytics. If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function generateEmailVerificationText(data: EmailVerificationData): string {
  const { userName, verificationUrl, expiresIn = "24 hours" } = data;

  return `
Hi ${userName},

Thanks for signing up for Safee Analytics!

To complete your registration, please verify your email address by clicking the link below:
${verificationUrl}

This verification link will expire in ${expiresIn}. After verification, you'll have full access to your Safee Analytics account.

Didn't sign up? If you didn't create an account with Safee Analytics, you can safely ignore this email.

---
Safee Analytics
This email was sent automatically. Please do not reply to this email.
`.trim();
}
