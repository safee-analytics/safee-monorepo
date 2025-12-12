/**
 * Delete Account Verification Template
 * Sent when a user requests to delete their account
 */

interface DeleteAccountVerificationData {
  userName: string;
  userEmail: string;
  verificationUrl: string;
  expiresIn?: string;
}

export function generateDeleteAccountVerificationHTML(data: DeleteAccountVerificationData): string {
  const { userName, userEmail, verificationUrl, expiresIn = "24 hours" } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Account Deletion</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #dc2626; font-size: 24px; font-weight: 600;">⚠️ Account Deletion Request</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 24px;">Hi ${userName},</p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 24px;">
                We received a request to delete your Safee Analytics account (<strong>${userEmail}</strong>).
              </p>

              <!-- Warning Box -->
              <table role="presentation" style="width: 100%; margin: 24px 0; border: 2px solid #fca5a5; border-radius: 6px; background-color: #fef2f2;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 12px 0; color: #dc2626; font-size: 16px; font-weight: 600;">⚠️ This action is permanent and cannot be undone</p>
                    <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 20px;">
                      Deleting your account will permanently remove:
                    </p>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #7f1d1d; font-size: 14px;">
                      <li>Your user profile and settings</li>
                      <li>All your organizations and teams</li>
                      <li>All data associated with your account</li>
                      <li>Access to all Safee Analytics services</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 24px;">
                If you're sure you want to proceed, click the button below to verify and complete the deletion:
              </p>

              <!-- Delete Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Confirm Account Deletion</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                This link will expire in ${expiresIn}. If you didn't request this, please contact our support team immediately and change your password.
              </p>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; color: #2563eb; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
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

export function generateDeleteAccountVerificationText(data: DeleteAccountVerificationData): string {
  const { userName, userEmail, verificationUrl, expiresIn = "24 hours" } = data;

  return `
Hi ${userName},

⚠️ ACCOUNT DELETION REQUEST

We received a request to delete your Safee Analytics account (${userEmail}).

THIS ACTION IS PERMANENT AND CANNOT BE UNDONE

Deleting your account will permanently remove:
- Your user profile and settings
- All your organizations and teams
- All data associated with your account
- Access to all Safee Analytics services

If you're sure you want to proceed, click the link below to verify and complete the deletion:
${verificationUrl}

This link will expire in ${expiresIn}. If you didn't request this, please contact our support team immediately and change your password.

---
Safee Analytics
This email was sent automatically. Please do not reply to this email.
`.trim();
}
