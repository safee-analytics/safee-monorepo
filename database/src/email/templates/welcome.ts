export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  organizationName?: string;
  isFirstOrganization: boolean;
}

export function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  const { userName, organizationName, isFirstOrganization } = data;

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Safee Analytics</title>
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
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome aboard! 👋</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 48px;">
                            <p style="margin: 0 0 20px 0; color: #111827; font-size: 17px; line-height: 28px;">
                                Hey ${userName},
                            </p>

                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                                Thanks for signing up${organizationName ? ` with <strong style="color: #111827;">${organizationName}</strong>` : ""}! We're genuinely excited to have you here.
                            </p>

                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                                Safee Analytics is built to make running your business easier. Whether it's accounting, HR, or managing customers - we've got your back.
                            </p>

                            ${
                              isFirstOrganization
                                ? `
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-left: 4px solid #059669; padding: 24px; border-radius: 8px; margin: 0 0 28px 0;">
                                <p style="margin: 0 0 16px 0; color: #047857; font-size: 16px; font-weight: 600;">Here's how to get started:</p>
                                <p style="margin: 0 0 8px 0; color: #065f46; font-size: 15px; line-height: 24px;">
                                    <strong>1.</strong> Set up your organization profile
                                </p>
                                <p style="margin: 0 0 8px 0; color: #065f46; font-size: 15px; line-height: 24px;">
                                    <strong>2.</strong> Invite your team (the more the merrier!)
                                </p>
                                <p style="margin: 0 0 8px 0; color: #065f46; font-size: 15px; line-height: 24px;">
                                    <strong>3.</strong> Check out Hisabiq, Kanz, and Nisbah
                                </p>
                                <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 24px;">
                                    <strong>4.</strong> Connect your existing tools
                                </p>
                            </div>
                            `
                                : ""
                            }

                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                                We've packed Safee with everything you need:
                            </p>

                            <!-- Feature List - Simpler -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <span style="color: #059669; font-size: 18px; margin-right: 8px;">✓</span>
                                        <span style="color: #111827; font-size: 15px; font-weight: 600;">Accounting & Invoicing</span>
                                        <span style="color: #6b7280; font-size: 15px;"> - Keep your finances organized</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <span style="color: #059669; font-size: 18px; margin-right: 8px;">✓</span>
                                        <span style="color: #111827; font-size: 15px; font-weight: 600;">HR & Payroll</span>
                                        <span style="color: #6b7280; font-size: 15px;"> - Manage your team effortlessly</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <span style="color: #059669; font-size: 18px; margin-right: 8px;">✓</span>
                                        <span style="color: #111827; font-size: 15px; font-weight: 600;">CRM</span>
                                        <span style="color: #6b7280; font-size: 15px;"> - Build better customer relationships</span>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${process.env.FRONTEND_URL ?? "https://app.safee.dev"}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);">
                                            Let's get started
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 24px;">
                                Got questions? Just hit reply - we're real people and we'd love to hear from you.
                            </p>

                            <p style="margin: 0 0 8px 0; color: #111827; font-size: 15px; line-height: 24px;">
                                Cheers,
                            </p>
                            <p style="margin: 0; color: #111827; font-size: 15px; line-height: 24px; font-weight: 600;">
                                The Safee Team
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

export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const { userName, organizationName, isFirstOrganization } = data;

  let text = `
Welcome aboard! 👋

Hey ${userName},

Thanks for signing up${organizationName ? ` with ${organizationName}` : ""}! We're genuinely excited to have you here.

Safee Analytics is built to make running your business easier. Whether it's accounting, HR, or managing customers - we've got your back.
`;

  if (isFirstOrganization) {
    text += `
Here's how to get started:

1. Set up your organization profile
2. Invite your team (the more the merrier!)
3. Check out Hisabiq, Kanz, and Nisbah
4. Connect your existing tools
`;
  }

  text += `
We've packed Safee with everything you need:

✓ Accounting & Invoicing - Keep your finances organized
✓ HR & Payroll - Manage your team effortlessly
✓ CRM - Build better customer relationships

Let's get started: ${process.env.FRONTEND_URL ?? "https://app.safee.dev"}

Got questions? Just hit reply - we're real people and we'd love to hear from you.

Cheers,
The Safee Team

---
© ${new Date().getFullYear()} Safee Analytics. All rights reserved.
  `.trim();

  return text;
}
