import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

type SendEmailPayload = {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
};

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  templateId,
  dynamicTemplateData,
}: SendEmailPayload) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ to, subject, html, text, templateId, dynamicTemplateData }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(responseText || `Email send failed (${response.status})`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
};

export const sendWelcomeEmail = async (email: string, name?: string) => {
  const safeName = name?.trim() || 'there';
  const templateId = process.env.EXPO_PUBLIC_SENDGRID_TEMPLATE_WELCOME;
  if (templateId) {
    return sendEmail({
      to: email,
      templateId,
      dynamicTemplateData: {
        name: safeName,
        app_url: 'https://globalready.tech',
      },
    });
  }

  const subject = 'Welcome to GlobalReady';
  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;background:#101722;padding:24px;font-family:Arial,sans-serif;color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#182434;border-radius:16px;border:1px solid #314868;">
          <tr>
            <td style="padding:28px 28px 16px;">
              <div style="font-size:12px;letter-spacing:2px;color:#90a9cb;">GLOBALREADY</div>
              <h2 style="margin:12px 0 8px;font-size:22px;">Welcome, ${safeName}!</h2>
              <p style="margin:0 0 20px;color:#90a9cb;font-size:14px;line-height:1.6;">
                You're all set to explore work abroad paths, tailored CVs, and skill upgrades.
              </p>
              <a href="https://globalready.tech" style="display:inline-block;padding:12px 18px;background:#0d6cf2;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;">
                Explore GlobalReady
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;color:#90a9cb;font-size:11px;border-top:1px solid #314868;">
              Need help? Reply to this email.<br/>
              © GlobalReady
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendPaymentConfirmationEmail = async (
  email: string,
  amount: number,
  reference?: string
) => {
  const templateId = process.env.EXPO_PUBLIC_SENDGRID_TEMPLATE_PAYMENT;
  if (templateId) {
    return sendEmail({
      to: email,
      templateId,
      dynamicTemplateData: {
        amount: (amount / 100).toFixed(2),
        reference: reference || '',
        app_url: 'https://globalready.tech',
      },
    });
  }

  const subject = 'Payment confirmed';
  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;background:#101722;padding:24px;font-family:Arial,sans-serif;color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#182434;border-radius:16px;border:1px solid #314868;">
          <tr>
            <td style="padding:28px 28px 16px;">
              <div style="font-size:12px;letter-spacing:2px;color:#90a9cb;">GLOBALREADY</div>
              <h2 style="margin:12px 0 8px;font-size:22px;">Payment confirmed</h2>
              <p style="margin:0 0 8px;color:#90a9cb;font-size:14px;line-height:1.6;">
                We received your payment of $${(amount / 100).toFixed(2)}.
              </p>
              ${reference ? `<p style="margin:0 0 16px;color:#90a9cb;font-size:12px;">Reference: ${reference}</p>` : ''}
              <a href="https://globalready.tech" style="display:inline-block;padding:12px 18px;background:#0d6cf2;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;">
                Continue in GlobalReady
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;color:#90a9cb;font-size:11px;border-top:1px solid #314868;">
              © GlobalReady
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendCvDownloadEmail = async (email: string, cvId?: string) => {
  const subject = 'Your CV is ready to download';
  const deepLink = cvId
    ? `globalreadymobile://download-cv?cvId=${cvId}`
    : 'globalreadymobile://download-cv';
  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;background:#101722;padding:24px;font-family:Arial,sans-serif;color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#182434;border-radius:16px;border:1px solid #314868;">
          <tr>
            <td style="padding:28px 28px 16px;">
              <div style="font-size:12px;letter-spacing:2px;color:#90a9cb;">GLOBALREADY</div>
              <h2 style="margin:12px 0 8px;font-size:22px;">Your CV is ready!</h2>
              <p style="margin:0 0 8px;color:#90a9cb;font-size:14px;line-height:1.6;">
                Your optimized, ATS-ready CV has been generated. Tap the button below to open the GlobalReady app and download it as a PDF.
              </p>
              <p style="margin:0 0 20px;color:#90a9cb;font-size:13px;line-height:1.6;">
                If the button doesn't open the app automatically, open GlobalReady and go to <strong style="color:#ffffff;">My CVs → Download CV</strong>.
              </p>
              <a href="${deepLink}" style="display:inline-block;padding:12px 24px;background:#0d6cf2;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">
                Download My CV
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;color:#90a9cb;font-size:11px;border-top:1px solid #314868;">
              Good luck with your applications!<br/>
              © GlobalReady
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};
