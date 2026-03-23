import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { jobTitle, jobCompany, jobDescription } = await req.json();

    if (!jobTitle) {
      return new Response(JSON.stringify({ error: 'jobTitle is required' }), { status: 400 });
    }

    // Get user's latest CV
    const { data: cvRow } = await supabase
      .from('cvs')
      .select('cv_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cvData = cvRow?.cv_data;
    const candidateName = cvData?.personal?.fullName ?? 'the candidate';
    const skills = cvData?.skills?.slice(0, 6).join(', ') ?? '';
    const latestRole = cvData?.experience?.[0];
    const latestRoleText = latestRole
      ? `Currently/Previously: ${latestRole.title} at ${latestRole.company}`
      : '';

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const prompt = `Write a concise, professional cover letter (160-200 words) for this job application.

Candidate: ${candidateName}
${latestRoleText}
${skills ? `Key skills: ${skills}` : ''}

Target Role: ${jobTitle} at ${jobCompany}
${jobDescription ? `Job context: ${jobDescription.slice(0, 400)}` : ''}

Requirements:
- Address it to "Hiring Team" (we don't know the hiring manager's name)
- Open with genuine enthusiasm for this specific company/role
- Highlight 1-2 most relevant skills/experiences from the candidate's background
- Keep it to 3 short paragraphs: intro, value proposition, close
- End with "Yours sincerely,\n${candidateName}"
- Sound natural and human, not like a template
- Return ONLY the cover letter text, no subject line, no extra formatting`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const coverLetter = (message.content[0] as any).text.trim();

    return new Response(
      JSON.stringify({ cover_letter: coverLetter }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('generate-cover-letter error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
