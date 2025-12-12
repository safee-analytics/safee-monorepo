/**
 * Change Email Confirmation Template
 * Sent when a user requests to change their email address
 */

interface ChangeEmailConfirmationData {
  userName: string;
  currentEmail: string;
  newEmail: string;
  confirmationUrl: string;
  expiresIn?: string;
}

export function generateChangeEmailConfirmationHTML(data: ChangeEmailConfirmationData): string {
  const { userName, currentEmail, newEmail, confirmationUrl, expiresIn = "1 hour" } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 600;">Confirm Your New Email Address</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 24px;">Hi ${userName},</p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 24px;">
                You recently requested to change your email address for your Safee Analytics account.
              </p>

              <!-- Email Change Details -->
              <table role="presentation" style="width: 100%; margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Current Email:</p>
                    <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 500;">${currentEmail}</p>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">New Email:</p>
                    <p style="margin: 0; color: #2563eb; font-size: 16px; font-weight: 500;">${newEmail}</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 24px;">
                Click the button below to confirm this change:
              </p>

              <!-- Confirm Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Confirm Email Change</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                This link will expire in ${expiresIn}. If you didn't request this change, please contact our support team immediately.
              </p>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; color: #2563eb; font-size: 14px; word-break: break-all;">
                ${confirmationUrl}
              </p>
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

export function generateChangeEmailConfirmationText(data: ChangeEmailConfirmationData): string {
  const { userName, currentEmail, newEmail, confirmationUrl, expiresIn = "1 hour" } = data;

  return `
Hi ${userName},

You recently requested to change your email address for your Safee Analytics account.

Current Email: ${currentEmail}
New Email: ${newEmail}

Click the link below to confirm this change:
${confirmationUrl}

This link will expire in ${expiresIn}. If you didn't request this change, please contact our support team immediately.

---
Safee Analytics
This email was sent automatically. Please do not reply to this email.
`.trim();
}
