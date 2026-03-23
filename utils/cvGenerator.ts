import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';
import { CVData } from '@/hooks/useCVBuilder';

// Generate ATS-Optimized HTML Template
const generateATSOptimizedHTML = (cvData: CVData): string => {
  const { personal, experience, education, skills, languages, certifications, summary } = cvData;

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
      <!-- Header -->
      <h1>${personal.fullName || 'Your Name'}</h1>
      <div class="contact-info">
        ${personal.email || ''} | ${personal.phone || ''} | ${personal.country || ''}
        ${personal.linkedIn ? `| <a href="${personal.linkedIn}">LinkedIn Profile</a>` : ''}
      </div>

      ${summary ? `
        <h2>Professional Summary</h2>
        <p>${summary}</p>
      ` : ''}

      <!-- Work Experience -->
      ${experience && experience.length > 0 ? `
        <h2>Work Experience</h2>
        ${experience.map(exp => `
          <div class="section-item">
            <h3>${exp.jobTitle || ''} | <span class="company-name">${exp.company || ''}</span></h3>
            <div class="date-range">
              ${formatDate(exp.startDate)} - ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
            </div>
            <ul>
              ${(exp.responsibilities || []).map((resp: string) => `<li>${resp}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      ` : ''}

      <!-- Education -->
      ${education && education.length > 0 ? `
        <h2>Education</h2>
        ${education.map(edu => `
          <div class="section-item">
            <h3>${edu.degree || ''} - ${edu.fieldOfStudy || ''}</h3>
            <div class="company-name">${edu.institution || ''}</div>
            <div class="date-range">${formatDate(edu.graduationDate)}</div>
          </div>
        `).join('')}
      ` : ''}

      <!-- Skills -->
      ${skills && skills.length > 0 ? `
        <h2>Skills</h2>
        <div class="skills-list">
          ${skills.join(' • ')}
        </div>
      ` : ''}

      ${languages && languages.length > 0 ? `
        <h2>Languages</h2>
        <div class="skills-list">
          ${languages.map((lang: any) => `${lang.language} (${lang.proficiency})`).join(' • ')}
        </div>
      ` : ''}

      ${certifications && certifications.length > 0 ? `
        <h2>Certifications</h2>
        ${certifications.map((cert: any) => `
          <div class="section-item">
            <strong>${cert.name}</strong> - ${cert.issuer} (${formatDate(cert.dateIssued)})
          </div>
        `).join('')}
      ` : ''}
    </body>
    </html>
  `;
};

const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const generateCVPDF = async (cvId: string): Promise<{ filePath: string; cloudUrl: string }> => {
  try {
    // 1. Fetch CV data from Supabase
    const { data: cv, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .single();

    if (error) throw error;

    const cvData = cv.cv_data as CVData;

    // 2. Generate ATS-optimized HTML
    const htmlContent = generateATSOptimizedHTML(cvData);

    // Note: For React Native, you'll need to use a library like react-native-html-to-pdf
    // or generate the PDF on the server side via Edge Function
    // This is a placeholder for the PDF generation logic
    
    // 3. For now, we'll store the HTML and generate PDF via Edge Function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Upload HTML to storage for PDF generation
    const fileName = `${user.id}/${cvId}.html`;
    const { error: uploadError } = await supabase.storage
      .from('uploaded-cvs')
      .upload(fileName, htmlContent, {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Call Edge Function to generate PDF
    const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/generate-cv-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ cvId, htmlContent }),
    });

    const pdfText = await pdfResponse.text();
    if (!pdfResponse.ok) {
      throw new Error(pdfText || `PDF generation failed (${pdfResponse.status})`);
    }

    const pdfData = JSON.parse(pdfText);

    // 4. Update CV record with PDF URL
    const pdfUrl = `${user.id}/${cvId}.pdf`;
    await supabase
      .from('cvs')
      .update({ pdf_url: pdfUrl })
      .eq('id', cvId);

    return {
      filePath: pdfData.filePath || '',
      cloudUrl: pdfUrl,
    };

  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};
