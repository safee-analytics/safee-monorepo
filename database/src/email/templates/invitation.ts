export interface InvitationEmailData {
  inviterName: string;
  organizationName: string;
  invitationUrl: string;
  role?: string;
}

export function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const { inviterName, organizationName, invitationUrl, role } = data;

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've Been Invited - Safee Analytics</title>
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
                            <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">You've Been Invited!</h2>
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                                <strong style="color: #111827;">${inviterName}</strong> has invited you to join <strong style="color: #111827;">${organizationName}</strong> on Safee Analytics${role ? ` as a <strong style="color: #059669;">${role}</strong>` : ""}.
                            </p>

                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 15px; line-height: 24px;">
                                Safee Analytics is a comprehensive business management platform designed for MENA region businesses, offering integrated modules for accounting, HR & payroll, and CRM functionality.
                            </p>

                            <!-- Accept Invitation Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${invitationUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                This invitation link will expire in 7 days. If you don't want to join this organization, you can safely ignore this email.
                            </p>

                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>

                            <p style="margin: 0; padding: 12px; background-color: #f9fafb; border-radius: 6px; word-break: break-all; font-size: 12px; color: #4b5563;">
                                ${invitationUrl}
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

export function generateInvitationEmailText(data: InvitationEmailData): string {
  const { inviterName, organizationName, invitationUrl, role } = data;

  return `
You've Been Invited! - Safee Analytics

${inviterName} has invited you to join ${organizationName} on Safee Analytics${role ? ` as a ${role}` : ""}.

Safee Analytics is a comprehensive business management platform designed for MENA region businesses, offering integrated modules for accounting, HR & payroll, and CRM functionality.

Accept your invitation by visiting:
${invitationUrl}

This invitation link will expire in 7 days. If you don't want to join this organization, you can safely ignore this email.

© ${new Date().getFullYear()} Safee Analytics. All rights reserved.
  `.trim();
}
