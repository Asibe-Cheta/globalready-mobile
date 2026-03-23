import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

Deno.serve(async (req) => {
  try {
    const { cvText, jobDescription, jobTitle } = await req.json();

    if (!cvText || (!jobDescription && !jobTitle)) {
      return new Response(
        JSON.stringify({ error: 'Missing cvText or job information' }),
        { status: 400 }
      );
    }

    // Build a meaningful job context even when description is sparse
    let jobContext = '';
    if (jobTitle) {
      jobContext += `Job Title: ${jobTitle}\n`;
    }
    if (jobDescription && jobDescription.length > 20) {
      jobContext += `Job Description:\n${jobDescription}`;
    } else if (jobTitle) {
      jobContext += `\nNote: No detailed job description was provided. Analyze the CV against typical requirements for a "${jobTitle}" role. Consider standard industry skills, qualifications, and experience expected for this position.`;
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are an expert CV/resume analyst. Analyze this CV against the target job and provide an accurate, fair assessment. Be thorough — identify ALL matching skills, experience, and qualifications. Give credit for relevant experience even if keywords don't match exactly. Return ONLY raw JSON with no markdown fences, no backticks, no explanation.

CV:
${cvText}

${jobContext}

Required JSON format (return ONLY this, no wrapping):
{
  "match_score": <0-100 integer — be fair and accurate: 70+ for strong matches, 40-69 for moderate, below 40 for weak>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": [
    {"skill": "SkillName", "priority": "HIGH", "reason": "Why this skill matters for the role"}
  ],
  "nice_to_have_skills": ["optional skill that would strengthen the application"],
  "ats_suggestions": ["Actionable tip to improve CV for this role"],
  "overall_assessment": "2-3 sentence summary of the candidate's fit for this role",
  "recommended_courses": [
    {"course_id": "course-1", "title": "Course Name", "duration_hours": 6, "rating": 4.8}
  ]
}`
      }]
    });

    // Strip markdown code fences if the model wraps the JSON
    let rawText = message.content[0].text.trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const analysis = JSON.parse(rawText);

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('CV analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
