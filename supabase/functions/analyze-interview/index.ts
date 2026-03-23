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

    const { transcript, jobTitle, company } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No transcript to analyse. Please complete the interview before ending.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const prompt = `You are an expert interview coach. Analyse this mock interview transcript for a ${jobTitle} role at ${company} and provide detailed, actionable feedback.

TRANSCRIPT:
${transcript}

Evaluate the candidate on these dimensions:
1. **Communication clarity** — Did they express ideas clearly and concisely?
2. **Relevance** — Did they answer what was actually asked?
3. **Use of examples** — Did they use specific, concrete examples (STAR method)?
4. **Confidence & tone** — Did they sound assured and professional?
5. **Technical depth** — Were their answers knowledgeable for this role?

Return ONLY valid JSON in this exact format (no markdown):
{
  "overall_score": 74,
  "summary": "A 2-3 sentence overall assessment of the candidate's performance.",
  "strengths": [
    "Specific strength observed in the interview with example",
    "Another strength with evidence from the transcript"
  ],
  "improvements": [
    "Specific area to work on with actionable advice",
    "Another improvement area with concrete suggestion"
  ],
  "question_feedback": [
    {
      "question": "The interviewer's question (summarised)",
      "score": 80,
      "feedback": "What the candidate did well and what could be improved for this specific answer"
    }
  ],
  "recommended_practice": [
    "Specific practice exercise or resource to improve",
    "Another recommendation"
  ]
}

Scoring guide: 90-100 = Outstanding, 75-89 = Strong, 60-74 = Good with room to grow, 45-59 = Needs work, below 45 = Significant preparation needed.
Be honest but encouraging. Base all feedback strictly on what was said in the transcript.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    let rawText = (message.content[0] as any).text.trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const feedback = JSON.parse(rawText);

    // Save to interview_sessions table (non-fatal)
    await supabase.from('interview_sessions').insert({
      user_id: user.id,
      job_title: jobTitle,
      company,
      transcript,
      overall_score: feedback.overall_score,
      feedback,
      created_at: new Date().toISOString(),
    }).then(() => {}, () => {}); // ignore errors if table doesn't exist

    return new Response(
      JSON.stringify(feedback),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('analyze-interview error:', error);
    const errMsg = error?.message || String(error) || 'Unknown edge function error';
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
