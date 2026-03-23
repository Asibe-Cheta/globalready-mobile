/**
 * Shared CV data type and HTML builder for view and download.
 */

export interface CVData {
  personal?: {
    fullName?: string;
    email?: string;
    phone?: string;
    country?: string;
    linkedIn?: string;
    portfolio?: string;
  };
  experience?: Array<{
    jobTitle?: string;
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    currentlyWorking?: boolean;
    current?: boolean;
    responsibilities?: string[];
    achievements?: string[];
  }>;
  education?: Array<{
    institution?: string;
    school?: string;
    degree?: string;
    fieldOfStudy?: string;
    location?: string;
    graduationDate?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
  }>;
  skills?: string[];
  languages?: Array<{ language?: string; name?: string; proficiency: string }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    dateIssued?: string;
    issuedAt?: string;
    expiresAt?: string;
  }>;
  summary?: string;
}

export function formatCvDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildCVHtml(cv: CVData): string {
  const p = cv.personal || {};
  const name = p.fullName || 'Your Name';

  const contactParts: string[] = [];
  if (p.email) contactParts.push(p.email);
  if (p.phone) contactParts.push(p.phone);
  if (p.country) contactParts.push(p.country);
  if (p.linkedIn) contactParts.push(p.linkedIn);
  if (p.portfolio) contactParts.push(p.portfolio);

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 40px 48px; line-height: 1.5; font-size: 11pt; }
  h1 { font-size: 22pt; font-weight: 700; margin-bottom: 4px; color: #111; }
  .contact { font-size: 9pt; color: #555; margin-bottom: 20px; }
  .contact span { margin-right: 12px; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0d6cf2; border-bottom: 2px solid #0d6cf2; padding-bottom: 4px; margin-bottom: 10px; }
  .entry { margin-bottom: 10px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
  .entry-title { font-weight: 700; font-size: 11pt; }
  .entry-sub { font-size: 10pt; color: #444; }
  .entry-date { font-size: 9pt; color: #666; text-align: right; white-space: nowrap; }
  ul { padding-left: 18px; margin-top: 4px; }
  li { font-size: 10pt; margin-bottom: 2px; }
  .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #e8f0fe; color: #0d6cf2; padding: 3px 10px; border-radius: 12px; font-size: 9pt; font-weight: 500; }
  .lang-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10pt; }
  .summary { font-size: 10pt; color: #333; line-height: 1.6; }
</style></head><body>`;

  html += `<h1>${escapeHtml(name)}</h1>`;
  if (contactParts.length) {
    html += `<div class="contact">${contactParts.map((c) => `<span>${escapeHtml(c)}</span>`).join(' | ')}</div>`;
  }

  if (cv.summary) {
    html += `<div class="section"><div class="section-title">Professional Summary</div><div class="summary">${escapeHtml(cv.summary)}</div></div>`;
  }

  if (cv.skills?.length) {
    html += `<div class="section"><div class="section-title">Skills</div><div class="skills-list">${cv.skills.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}</div></div>`;
  }

  if (cv.experience?.length) {
    html += `<div class="section"><div class="section-title">Work Experience</div>`;
    for (const exp of cv.experience) {
      const isCurrent = exp.currentlyWorking ?? exp.current;
      const dateRange = isCurrent
        ? `${formatCvDate(exp.startDate)} – Present`
        : `${formatCvDate(exp.startDate)} – ${formatCvDate(exp.endDate)}`;
      const expTitle = exp.jobTitle || exp.title || '';
      const bullets = exp.responsibilities || exp.achievements || [];
      html += `<div class="entry">
        <div class="entry-header">
          <div><span class="entry-title">${escapeHtml(expTitle)}</span><br/><span class="entry-sub">${escapeHtml(exp.company || '')}</span></div>
          <div class="entry-date">${dateRange}</div>
        </div>`;
      if (bullets.length) {
        html += `<ul>${bullets.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  if (cv.education?.length) {
    html += `<div class="section"><div class="section-title">Education</div>`;
    for (const edu of cv.education) {
      const eduName = edu.institution || edu.school || '';
      const eduDegree = edu.degree || '';
      const eduField = (edu as any).fieldOfStudy ? ` in ${(edu as any).fieldOfStudy}` : '';
      const dateRange = edu.graduationDate
        ? formatCvDate(edu.graduationDate)
        : edu.current
          ? `${formatCvDate(edu.startDate)} – Present`
          : `${formatCvDate(edu.startDate)} – ${formatCvDate(edu.endDate)}`;
      html += `<div class="entry">
        <div class="entry-header">
          <div><span class="entry-title">${escapeHtml(eduDegree)}${escapeHtml(eduField)}</span><br/><span class="entry-sub">${escapeHtml(eduName)}${edu.location ? `, ${escapeHtml(edu.location)}` : ''}</span></div>
          <div class="entry-date">${dateRange}</div>
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  if (cv.certifications?.length) {
    html += `<div class="section"><div class="section-title">Certifications</div>`;
    for (const cert of cv.certifications) {
      const certDate = cert.dateIssued || cert.issuedAt;
      html += `<div class="entry">
        <span class="entry-title">${escapeHtml(cert.name)}</span>
        ${cert.issuer ? `<br/><span class="entry-sub">${escapeHtml(cert.issuer)}</span>` : ''}
        ${certDate ? `<br/><span class="entry-date">${formatCvDate(certDate)}</span>` : ''}
      </div>`;
    }
    html += `</div>`;
  }

  if (cv.languages?.length) {
    html += `<div class="section"><div class="section-title">Languages</div>`;
    for (const lang of cv.languages) {
      const langName = lang.language || lang.name || '';
      html += `<div class="lang-row"><span>${escapeHtml(langName)}</span><span style="color:#666">${escapeHtml(lang.proficiency)}</span></div>`;
    }
    html += `</div>`;
  }

  html += `</body></html>`;
  return html;
}
