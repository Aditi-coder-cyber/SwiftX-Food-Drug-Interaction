/**
 * Email service using Resend HTTP API (no SMTP).
 * Free tier: 100 emails/day, 3,000/month.
 * Fully compatible with Render free trial.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'SafeMed AI <onboarding@resend.dev>';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('❌ RESEND_API_KEY is not configured');
        return false;
    }

    try {
        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [options.to],
                subject: options.subject,
                html: options.html,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('❌ Resend API error:', response.status, error);
            return false;
        }

        console.log(`✅ Email sent to ${options.to}`);
        return true;
    } catch (error: any) {
        console.error('❌ Email send failed:', error.message);
        return false;
    }
}

/**
 * Send a 2FA OTP email with a clean HTML template.
 */
export async function sendOTPEmail(to: string, otp: string, userName?: string): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding:40px 0;">
        <tr>
            <td align="center">
                <table width="420" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.08); overflow:hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#10b981,#3b82f6); padding:24px; text-align:center;">
                            <span style="font-size:32px;">💊</span>
                            <h1 style="color:#fff; margin:8px 0 0; font-size:22px;">SafeMed AI</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px 28px;">
                            <p style="color:#334155; font-size:16px; margin:0 0 8px;">
                                Hello${userName ? ' ' + userName : ''},
                            </p>
                            <p style="color:#64748b; font-size:14px; margin:0 0 24px; line-height:1.6;">
                                Your verification code for two-factor authentication is:
                            </p>
                            <div style="background:#f0fdf4; border:2px solid #86efac; border-radius:12px; padding:20px; text-align:center; margin:0 0 24px;">
                                <span style="font-size:36px; font-weight:700; letter-spacing:8px; color:#059669;">${otp}</span>
                            </div>
                            <p style="color:#94a3b8; font-size:13px; margin:0; line-height:1.5;">
                                This code expires in <strong>5 minutes</strong>. If you didn't request this, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f8fafc; padding:16px 28px; text-align:center; border-top:1px solid #e2e8f0;">
                            <p style="color:#94a3b8; font-size:11px; margin:0;">
                                © ${new Date().getFullYear()} SafeMed AI — Your Medication Safety Assistant
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    return sendEmail({
        to,
        subject: `${otp} — Your SafeMed AI Verification Code`,
        html,
    });
}
