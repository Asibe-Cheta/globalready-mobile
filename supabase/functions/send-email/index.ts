const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL');
const fromName = Deno.env.get('SENDGRID_FROM_NAME') || 'GlobalReady';

type Payload = {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!sendgridApiKey || !fromEmail) {
      return new Response(JSON.stringify({ error: 'SendGrid env vars missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { to, subject, html, text, templateId, dynamicTemplateData } =
      (await req.json()) as Payload;

    if (!to || (!templateId && (!subject || (!html && !text)))) {
      return new Response(JSON.stringify({ error: 'Missing email fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: recipients.map((email) => ({ email })),
            ...(templateId ? { dynamic_template_data: dynamicTemplateData || {} } : {}),
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        ...(templateId
          ? { template_id: templateId }
          : {
              subject,
              content: [
                ...(text ? [{ type: 'text/plain', value: text }] : []),
                ...(html ? [{ type: 'text/html', value: html }] : []),
              ],
            }),
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return new Response(JSON.stringify({ error: 'SendGrid error', details }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Send email error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
