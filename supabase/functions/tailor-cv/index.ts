import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

const OUTPUT_SCHEMA = `{
  "personal": { "fullName": "", "email": "", "phone": "", "country": "", "linkedIn": "", "portfolio": "" },
  "summary": "A professional summary tailored to the target role",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "jobTitle": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "currentlyWorking": false,
      "responsibilities": ["bullet1", "bullet2"]
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "fieldOfStudy": "",
      "graduationDate": "",
      "location": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "dateIssued": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ]
}`;

Deno.serve(async (req) => {
  try {
    const { cvData, cvText, jobDescription, jobTitle } = await req.json();

    if ((!cvData && !cvText) || (!jobDescription && !jobTitle)) {
      return new Response(
        JSON.stringify({ error: 'Missing CV data or job information' }),
        { status: 400 }
      );
    }

    // Build job context
    let jobContext = '';
    if (jobTitle) {
      jobContext += `Target Job Title: ${jobTitle}\n`;
    }
    if (jobDescription && jobDescription.length > 20) {
      jobContext += `Job Description:\n${jobDescription}`;
    } else if (jobTitle) {
      jobContext += `\nNo detailed job description provided. Optimize the CV for a typical "${jobTitle}" role based on standard industry requirements for this position.`;
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    // Build prompt based on input type
    const cvSection = cvData
      ? `CV Data (structured JSON):\n${JSON.stringify(cvData, null, 2)}`
      : `CV Text (extracted from uploaded document):\n${cvText}`;

    const prompt = `You are an expert CV/resume optimizer. Your job is to tailor this CV for the target role while maintaining 100% factual accuracy.

${cvSection}

${jobContext}

OPTIMIZATION INSTRUCTIONS:
1. PROFESSIONAL SUMMARY: Rewrite to highlight the candidate's most relevant experience and skills for this specific role. Reference specific achievements from their actual experience.

2. SKILLS: Reorder skills to put the most relevant ones first. Add skills the candidate clearly demonstrates through their experience but may not have explicitly listed (e.g., if they built REST APIs, they have "API Development"). Do NOT add skills the candidate has no evidence of.

3. EXPERIENCE BULLETS: Rewrite responsibility bullets to:
   - Incorporate relevant keywords from the job requirements naturally
   - Emphasize aspects of their work most relevant to the target role
   - Add quantifiable metrics where the original suggests impact (e.g., "improved performance" → "improved page load performance by optimizing render cycles")
   - Frame existing experience using industry terminology that matches the target role
   - Do NOT invent responsibilities, projects, or achievements that aren't supported by the original CV

4. SKILL ORDERING: Place the most job-relevant skills at the top of the skills array

CRITICAL RULES:
- NEVER fabricate or invent information — no fake companies, dates, degrees, certifications, or skills the candidate doesn't have
- NEVER change personal details (name, email, phone, country, LinkedIn, portfolio)
- NEVER change company names, dates, institutions, or degree names
- DO enhance how existing experience is described to better match the target role
- DO add skills that are clearly implied by the candidate's work (e.g., a Next.js developer obviously knows React)
- Keep ALL experience entries — do not remove any
- Use field names EXACTLY as shown in the schema below
- Return ONLY valid JSON, no markdown fences or explanation

Required JSON structure:
${OUTPUT_SCHEMA}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt,
      }]
    });

    // Strip markdown code fences if the model wraps the JSON
    let rawText = message.content[0].text.trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const tailoredCV = JSON.parse(rawText);

    return new Response(JSON.stringify(tailoredCV), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('CV tailoring error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
