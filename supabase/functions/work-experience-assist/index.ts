import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

type Payload = {
  jobTitle?: string;
  company?: string;
  industry?: string;
  years?: string;
  existing?: string;
};

Deno.serve(async (req) => {
  try {
    const { jobTitle, company, industry, years, existing } = (await req.json()) as Payload;

    if (!jobTitle) {
      return new Response(JSON.stringify({ error: 'Missing jobTitle' }), { status: 400 });
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Generate 3-5 concise CV bullet points for this role.

Job Title: ${jobTitle}
Company: ${company || 'N/A'}
Industry: ${industry || 'N/A'}
Years: ${years || 'N/A'}
Existing bullets (if any): ${existing || 'None'}

Rules:
- Output JSON only: {"bullets":["...","..."]} (no markdown, no code fences).
- Each bullet starts with a strong action verb.
- Keep each bullet under 140 characters.
- Focus on outcomes/impact and tools or metrics where possible.`,
        },
      ],
    });

    const responseText = message.content?.[0]?.text || '';
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    const jsonText =
      jsonStart !== -1 && jsonEnd !== -1 ? responseText.slice(jsonStart, jsonEnd + 1) : responseText;
    const parsed = JSON.parse(jsonText);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Work experience assist error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unable to generate bullets' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
