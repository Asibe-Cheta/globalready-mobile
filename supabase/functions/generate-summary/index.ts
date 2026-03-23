const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { cvData } = await req.json();

    if (!cvData) {
      return new Response(JSON.stringify({ error: 'Missing cvData' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context from CV data
    const parts: string[] = [];

    if (cvData.personal?.fullName) {
      parts.push(`Name: ${cvData.personal.fullName}`);
    }
    if (cvData.personal?.country) {
      parts.push(`Location: ${cvData.personal.country}`);
    }

    if (cvData.skills?.length) {
      parts.push(`Key Skills: ${cvData.skills.join(', ')}`);
    }

    if (cvData.experience?.length) {
      const expSummary = cvData.experience.map((exp: any) => {
        const title = exp.title || exp.jobTitle || '';
        const company = exp.company || '';
        const achievements = (exp.achievements || exp.responsibilities || []).slice(0, 3).join('; ');
        return `${title} at ${company}${achievements ? ` — ${achievements}` : ''}`;
      }).join('\n');
      parts.push(`Work Experience:\n${expSummary}`);
    }

    if (cvData.education?.length) {
      const eduSummary = cvData.education.map((edu: any) => {
        const school = edu.school || edu.institution || '';
        const degree = edu.degree || '';
        return `${degree} from ${school}`;
      }).join('; ');
      parts.push(`Education: ${eduSummary}`);
    }

    if (cvData.certifications?.length) {
      const certSummary = cvData.certifications.map((c: any) => c.name).filter(Boolean).join(', ');
      if (certSummary) parts.push(`Certifications: ${certSummary}`);
    }

    if (cvData.languages?.length) {
      const langSummary = cvData.languages.map((l: any) =>
        `${l.language || l.name} (${l.proficiency})`
      ).join(', ');
      parts.push(`Languages: ${langSummary}`);
    }

    const cvContext = parts.join('\n\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Based on this CV data, write a professional summary for the top of a CV/resume. The summary should be 3-4 sentences, written in first person implied (no "I"), focusing on years of experience, key competencies, and career value proposition. Make it compelling and ATS-friendly.

${cvContext}

Return ONLY the professional summary text, nothing else.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    const summary = result.content?.[0]?.text?.trim() || '';

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Generate summary error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
