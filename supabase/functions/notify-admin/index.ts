import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@globalready.tech';
    const fromName = Deno.env.get('SENDGRID_FROM_NAME') || 'GlobalReady';

    if (!sendgridApiKey) {
      return new Response(
        JSON.stringify({ error: 'SendGrid not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, data } = await req.json();

    // Get admin emails from settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_emails')
      .single();

    const adminEmails: string[] = settings?.value || ['admin@globalready.tech'];

    let subject = '';
    let html = '';

    if (type === 'new_registration') {
      subject = `New Course Registration: ${data.course_title || 'Unknown Course'}`;
      html = `
        <!doctype html>
        <html>
          <body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;color:#1e293b;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:24px 24px 12px;">
                  <div style="font-size:11px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">GlobalReady Admin</div>
                  <h2 style="margin:12px 0 8px;font-size:20px;color:#0f172a;">New Course Registration</h2>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 16px;">
                  <table width="100%" cellpadding="8" style="border:1px solid #e2e8f0;border-radius:8px;border-collapse:collapse;">
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;width:120px;">Student</td>
                      <td style="font-size:14px;">${data.full_name || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Email</td>
                      <td style="font-size:14px;"><a href="mailto:${data.email}">${data.email || 'N/A'}</a></td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Phone</td>
                      <td style="font-size:14px;">${data.phone || 'Not provided'}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Course</td>
                      <td style="font-size:14px;">${data.course_title || 'Unknown'}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Category</td>
                      <td style="font-size:14px;">${data.category || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Date</td>
                      <td style="font-size:14px;">${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 24px 20px;color:#64748b;font-size:11px;border-top:1px solid #e2e8f0;">
                  View in <a href="https://globalready.tech/admin" style="color:#0d6cf2;">Admin Dashboard</a>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
    } else if (type === 'new_payment') {
      const amountFormatted = ((data.amount || 0) / 100).toFixed(2);
      subject = `Payment Received: $${amountFormatted} from ${data.email || 'Unknown'}`;
      html = `
        <!doctype html>
        <html>
          <body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;color:#1e293b;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:24px 24px 12px;">
                  <div style="font-size:11px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">GlobalReady Admin</div>
                  <h2 style="margin:12px 0 8px;font-size:20px;color:#0f172a;">Payment Received</h2>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 16px;">
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-bottom:16px;">
                    <span style="font-size:28px;font-weight:800;color:#16a34a;">$${amountFormatted}</span>
                    <span style="color:#64748b;font-size:13px;margin-left:8px;">${data.currency || 'USD'}</span>
                  </div>
                  <table width="100%" cellpadding="8" style="border:1px solid #e2e8f0;border-radius:8px;border-collapse:collapse;">
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;width:120px;">Customer</td>
                      <td style="font-size:14px;">${data.email || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Method</td>
                      <td style="font-size:14px;">${data.payment_method || 'Stripe'}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Reference</td>
                      <td style="font-size:14px;font-family:monospace;">${data.reference || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Service</td>
                      <td style="font-size:14px;">${data.service || 'CV Export'}</td>
                    </tr>
                    <tr>
                      <td style="font-weight:700;color:#64748b;font-size:13px;">Status</td>
                      <td style="font-size:14px;"><span style="background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;">${data.status || 'Successful'}</span></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 24px 20px;color:#64748b;font-size:11px;border-top:1px solid #e2e8f0;">
                  View in <a href="https://globalready.tech/admin" style="color:#0d6cf2;">Admin Dashboard</a>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
    } else if (type === 'new_user') {
      subject = `New User Signup: ${data.email || 'Unknown'}`;
      html = `
        <!doctype html>
        <html>
          <body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;color:#1e293b;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:24px;">
                  <div style="font-size:11px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">GlobalReady Admin</div>
                  <h2 style="margin:12px 0 8px;font-size:20px;color:#0f172a;">New User Signup</h2>
                  <p style="margin:0;color:#475569;font-size:14px;">
                    <strong>${data.full_name || 'New user'}</strong> (${data.email || 'N/A'}) just created an account.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 24px 20px;color:#64748b;font-size:11px;border-top:1px solid #e2e8f0;">
                  View in <a href="https://globalready.tech/admin" style="color:#0d6cf2;">Admin Dashboard</a>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown notification type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via SendGrid
    const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: adminEmails.map((email: string) => ({ email })) }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!sgResponse.ok) {
      const details = await sgResponse.text();
      console.error('SendGrid error:', details);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Notify admin error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
