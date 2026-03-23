import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate ATS-Optimized HTML Template
const generateATSOptimizedHTML = (cvData: any): string => {
  const { personal, experience, education, skills, languages, certifications, summary } = cvData;

  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
          padding: 40px;
          background: #fff;
        }
        h1 {
          font-size: 26pt;
          font-weight: 700;
          margin-bottom: 8px;
          color: #000;
          letter-spacing: -0.5px;
        }
        h2 {
          font-size: 14pt;
          font-weight: 700;
          margin-top: 24px;
          margin-bottom: 12px;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          text-transform: uppercase;
        }
        h3 {
          font-size: 12pt;
          font-weight: 700;
          margin-top: 12px;
          margin-bottom: 4px;
        }
        .contact-info {
          font-size: 10pt;
          margin-bottom: 24px;
          line-height: 1.4;
        }
        .contact-info a {
          color: #000;
          text-decoration: none;
        }
        ul {
          margin-left: 20px;
          margin-top: 8px;
          margin-bottom: 12px;
        }
        li {
          margin-bottom: 6px;
        }
        .date-range {
          font-style: italic;
          color: #333;
          font-size: 10pt;
        }
        .company-name {
          font-weight: 600;
        }
        .section-item {
          margin-bottom: 18px;
        }
        .skills-list {
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      <!-- 1. Personal Contact Details -->
      <h1>${personal?.fullName || 'Your Name'}</h1>
      <div class="contact-info">
        ${personal?.email || ''} | ${personal?.phone || ''} | ${personal?.country || ''}
        ${personal?.linkedIn ? `| <a href="${personal.linkedIn}">LinkedIn Profile</a>` : ''}
      </div>

      <!-- 2. Professional Summary -->
      ${summary ? `
        <h2>Professional Summary</h2>
        <p>${summary}</p>
      ` : ''}

      <!-- 3. Skills -->
      ${skills && skills.length > 0 ? `
        <h2>Skills</h2>
        <div class="skills-list">
          ${skills.join(' • ')}
        </div>
      ` : ''}

      <!-- 4. Work Experience -->
      ${experience && experience.length > 0 ? `
        <h2>Work Experience</h2>
        ${experience.map((exp: any) => `
          <div class="section-item">
            <h3>${exp.jobTitle || exp.title || ''} | <span class="company-name">${exp.company || ''}</span></h3>
            <div class="date-range">
              ${formatDate(exp.startDate)} - ${exp.currentlyWorking || exp.current ? 'Present' : formatDate(exp.endDate)}
            </div>
            <ul>
              ${(exp.responsibilities || exp.achievements || []).map((resp: string) => `<li>${resp}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      ` : ''}

      <!-- 5. Education -->
      ${education && education.length > 0 ? `
        <h2>Education</h2>
        ${education.map((edu: any) => `
          <div class="section-item">
            <h3>${edu.degree || ''}${edu.fieldOfStudy ? ` - ${edu.fieldOfStudy}` : ''}</h3>
            <div class="company-name">${edu.institution || edu.school || ''}</div>
            <div class="date-range">${formatDate(edu.graduationDate || edu.endDate)}</div>
          </div>
        `).join('')}
      ` : ''}

      <!-- 6. Certifications -->
      ${certifications && certifications.length > 0 ? `
        <h2>Certifications</h2>
        ${certifications.map((cert: any) => `
          <div class="section-item">
            <strong>${cert.name}</strong>${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.dateIssued || cert.issuedAt ? ` (${formatDate(cert.dateIssued || cert.issuedAt)})` : ''}
          </div>
        `).join('')}
      ` : ''}

      <!-- 7. Languages -->
      ${languages && languages.length > 0 ? `
        <h2>Languages</h2>
        <div class="skills-list">
          ${languages.map((lang: any) => `${lang.language || lang.name} (${lang.proficiency})`).join(' • ')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

Deno.serve(async (req) => {
  try {
    const { cvId, htmlContent } = await req.json();

    if (!cvId) {
      return new Response(
        JSON.stringify({ error: 'Missing cvId' }),
        { status: 400 }
      );
    }

    // If HTML content not provided, fetch CV data and generate it
    let html = htmlContent;
    if (!html) {
      const { data: cv, error: cvError } = await supabase
        .from('cvs')
        .select('cv_data')
        .eq('id', cvId)
        .single();

      if (cvError) throw cvError;
      html = generateATSOptimizedHTML(cv.cv_data);
    }

    // For now, we'll store the HTML and return it
    // In production, you'd use a PDF generation library like puppeteer or wkhtmltopdf
    // For Supabase Edge Functions, you can use a service like PDFShift or similar
    
    // Get user ID from CV record
    const { data: cvRecord } = await supabase
      .from('cvs')
      .select('user_id')
      .eq('id', cvId)
      .single();
    
    const fileName = `${cvRecord?.user_id || 'anonymous'}/${cvId}.html`;
    
    const { error: uploadError } = await supabase.storage
      .from('uploaded-cvs')
      .upload(fileName, html, {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Update CV record with HTML URL (PDF generation can be done async)
    await supabase
      .from('cvs')
      .update({ pdf_url: fileName })
      .eq('id', cvId);

    return new Response(
      JSON.stringify({
        success: true,
        htmlUrl: fileName,
        message: 'HTML generated. PDF generation can be implemented with a PDF service.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
