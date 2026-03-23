import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@globalready.tech';
const fromName = Deno.env.get('SENDGRID_FROM_NAME') || 'GlobalReady';
const confirmationTemplateId = Deno.env.get('SENDGRID_TEMPLATE_CONFIRM');
const defaultRedirectTo = Deno.env.get('CONFIRM_REDIRECT_URL') || 'https://globalready.tech';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Payload = {
  email: string;
  password: string;
  fullName?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, fullName } = (await req.json()) as Payload;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user and generate confirmation link via admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { full_name: fullName?.trim() || '' },
        redirectTo: defaultRedirectTo,
      },
    });

    const actionLink = (data as any)?.properties?.action_link;
    const hashedToken = (data as any)?.properties?.hashed_token;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!actionLink && !hashedToken) {
      return new Response(
        JSON.stringify({ error: 'Unable to generate confirmation link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the confirmation URL
    // Use the action_link directly — it points to Supabase's verify endpoint
    // which will confirm the user and redirect to defaultRedirectTo
    const confirmationUrl = actionLink || defaultRedirectTo;

    // Send confirmation email via SendGrid
    if (sendgridApiKey && fromEmail) {
      const emailPayload: any = {
        personalizations: [
          {
            to: [{ email }],
            dynamic_template_data: {
              name: fullName?.trim() || 'there',
              confirmation_url: confirmationUrl,
              app_url: defaultRedirectTo,
            },
          },
        ],
        from: { email: fromEmail, name: fromName },
      };

      if (confirmationTemplateId) {
        // Use SendGrid dynamic template
        emailPayload.template_id = confirmationTemplateId;
      } else {
        // Fallback: send a simple HTML confirmation email
        emailPayload.subject = 'Confirm your GlobalReady account';
        emailPayload.content = [
          {
            type: 'text/html',
            value: `
              <!doctype html>
              <html>
                <body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;color:#1e293b;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:32px 24px 12px;">
                        <div style="font-size:11px;letter-spacing:2px;color:#0d6cf2;text-transform:uppercase;font-weight:700;">GlobalReady</div>
                        <h2 style="margin:16px 0 8px;font-size:22px;color:#0f172a;">Welcome, ${fullName?.trim() || 'there'}!</h2>
                        <p style="color:#475569;font-size:14px;line-height:1.6;">
                          Thanks for creating your GlobalReady account. Please confirm your email to get started.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 24px 24px;">
                        <a href="${confirmationUrl}" style="display:inline-block;background:#0d6cf2;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:999px;font-weight:700;font-size:14px;">
                          Confirm Email Address
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 24px 20px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;">
                        If you didn't create this account, you can safely ignore this email.
                      </td>
                    </tr>
                  </table>
                </body>
              </html>
            `,
          },
        ];
      }

      const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!sgResponse.ok) {
        const details = await sgResponse.text();
        console.error('SendGrid confirmation email error:', details);
        return new Response(
          JSON.stringify({ error: 'Failed to send confirmation email', details }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Custom signup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
