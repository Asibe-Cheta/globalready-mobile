# GlobalReady - Complete Project Setup

## Overview
GlobalReady is a mobile-first web application helping African professionals access international opportunities through three core paths:
1. **Work Abroad Assessment** - Personalized country/job targeting and readiness evaluation
2. **CV Builder & Tailoring** - ATS-optimized CV creation with job-specific tailoring ($5/tailor)
3. **Skills Hub** - High-demand career skills training (IELTS, German, Tech, etc.)

## Tech Stack Requirements

### Core Framework
- **Next.js 14+** (App Router)
- **TypeScript** (strict mode)
- **React 18+**

### Styling & UI
- **Tailwind CSS** (v3+)
- **Material Symbols Outlined** icons
- **Inter** font family (400, 500, 600, 700, 800 weights)
- Dark mode support (default dark, with light mode option)

### State Management & Data
- **React Context API** (for global state)
- **React Hook Form** (form handling)
- **Zod** (validation)
- **Supabase** (backend - already in use from memory)

### Features to Implement
- **Stripe/Paystack** integration (for $5 CV tailoring)
- **PDF generation** (for CV downloads)
- **File uploads** (CV upload for job matching)
- **Progress tracking** (multi-step forms)
- **AI Integration** (for CV analysis and job matching)

## Project Structure
```
globalready/
├── app/
│   ├── (onboarding)/
│   │   ├── page.tsx                    # Splash screen
│   │   ├── choose-path/
│   │   │   └── page.tsx               # Path selection
│   ├── (work-abroad)/
│   │   ├── assessment/
│   │   │   ├── intro/page.tsx         # Work abroad intro
│   │   │   ├── targeting/page.tsx     # Step 2: Country/job targeting
│   │   │   ├── experience/page.tsx    # Step 3: Experience & education
│   │   │   ├── language/page.tsx      # Step 4: Language & history
│   │   │   └── results/page.tsx       # Assessment results
│   │   ├── skill-gaps/page.tsx        # In-demand skills list
│   │   └── jobs/
│   │       ├── page.tsx               # Jobs feed
│   │       └── [id]/page.tsx          # Job details
│   ├── (cv-builder)/
│   │   ├── intro/page.tsx             # $5 CV Builder intro
│   │   ├── personal/page.tsx          # Step 1: Personal details
│   │   ├── experience/page.tsx        # Step 2: Work experience
│   │   ├── education/page.tsx         # Step 3: Education
│   │   ├── skills/page.tsx            # Step 4: Skills & availability
│   │   ├── languages/page.tsx         # Step 5: Languages
│   │   ├── certifications/page.tsx    # Step 6: Certifications
│   │   └── download/page.tsx          # CV ready for download
│   ├── (cv-tailor)/
│   │   ├── upload/page.tsx            # Upload CV + Job description
│   │   ├── analyzing/page.tsx         # AI analysis loading
│   │   ├── report/page.tsx            # Match report (% score)
│   │   ├── optimizing/page.tsx        # Tailoring in progress
│   │   ├── preview/page.tsx           # Locked preview
│   │   ├── payment/page.tsx           # Payment ($5)
│   │   └── confirmation/page.tsx      # Success + download
│   ├── (skills-hub)/
│   │   ├── page.tsx                   # Hub welcome
│   │   ├── courses/
│   │   │   ├── page.tsx               # Course catalog
│   │   │   ├── ielts/page.tsx         # IELTS curriculum
│   │   │   ├── german/page.tsx        # German language
│   │   │   ├── tech/page.tsx          # Tech courses
│   │   │   ├── data-analysis/page.tsx
│   │   │   ├── cybersecurity/page.tsx
│   │   │   ├── ai-engineering/page.tsx
│   │   │   ├── agile-pm/page.tsx
│   │   │   ├── job-coaching/page.tsx
│   │   │   └── side-hustle/page.tsx
│   │   └── register/
│   │       ├── page.tsx               # Info session registration
│   │       └── confirmation/page.tsx  # Registration confirmed
│   ├── api/
│   │   ├── analyze-cv/route.ts        # CV + Job analysis
│   │   ├── tailor-cv/route.ts         # Generate tailored CV
│   │   ├── payment/route.ts           # Stripe/Paystack webhook
│   │   └── jobs/route.ts              # Fetch curated jobs
│   └── layout.tsx                     # Root layout
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── progress-bar.tsx
│   │   ├── radio-card.tsx
│   │   ├── chip.tsx
│   │   └── modal.tsx
│   ├── forms/
│   │   ├── personal-details-form.tsx
│   │   ├── work-experience-form.tsx
│   │   ├── education-form.tsx
│   │   └── language-form.tsx
│   ├── cv/
│   │   ├── cv-preview.tsx
│   │   └── cv-generator.tsx
│   ├── job/
│   │   ├── job-card.tsx
│   │   └── job-filters.tsx
│   ├── course/
│   │   ├── course-card.tsx
│   │   └── curriculum-module.tsx
│   └── layout/
│       ├── header.tsx
│       ├── bottom-nav.tsx
│       └── progress-indicator.tsx
├── lib/
│   ├── supabase.ts                    # Supabase client
│   ├── stripe.ts                      # Stripe configuration
│   ├── cv-generator.ts                # PDF generation
│   ├── ai-analyzer.ts                 # CV/Job matching AI
│   └── validations/
│       ├── personal-details.ts
│       ├── work-experience.ts
│       └── education.ts
├── types/
│   ├── user.ts
│   ├── cv.ts
│   ├── job.ts
│   └── course.ts
├── hooks/
│   ├── use-multi-step-form.ts
│   ├── use-cv-builder.ts
│   └── use-payment.ts
├── contexts/
│   ├── user-context.tsx
│   ├── cv-builder-context.tsx
│   └── assessment-context.tsx
└── tailwind.config.ts
```

## Color Palette & Design System
```typescript
// tailwind.config.ts
colors: {
  primary: "#0d6cf2",           // Bright blue (CTAs, links, highlights)
  "background-light": "#f5f7f8", // Light mode bg
  "background-dark": "#101722",  // Dark mode bg (default)
  "surface-dark": "#182434",     // Card backgrounds
  "border-dark": "#314868",      // Borders in dark mode
  "text-secondary": "#90a9cb",   // Secondary text
}

// Typography
fontFamily: {
  display: ["Inter", "sans-serif"]
}

// Border Radius
borderRadius: {
  DEFAULT: "1rem",    // 16px
  lg: "1.5rem",       // 24px
  xl: "2rem",         // 32px
  full: "9999px"      // Pills/buttons
}
```

## Key Features Implementation

### 1. Multi-Step Form System
```typescript
// hooks/use-multi-step-form.ts
- Track current step (1-5)
- Progress percentage
- Form data persistence (localStorage)
- Validation per step
- Next/Previous navigation
```

### 2. CV Builder State Management
```typescript
// contexts/cv-builder-context.tsx
interface CVData {
  personal: PersonalDetails
  experience: WorkExperience[]
  education: Education[]
  skills: string[]
  languages: Language[]
  certifications: Certification[]
}
```

### 3. Payment Integration ($5 CV Tailoring)
```typescript
// lib/stripe.ts
- Mobile Money (MTN, Orange) for African users
- Credit Card (Stripe)
- $5 one-time payment
- Webhook handling
- PDF generation post-payment
```

### 4. AI CV Analysis
```typescript
// lib/ai-analyzer.ts
- Parse CV (PDF/DOCX)
- Extract job requirements from description
- Calculate match percentage
- Identify skill gaps
- Suggest improvements
- ATS optimization
```

### 5. Job Matching System
```typescript
// api/jobs/route.ts
- Curated job listings
- Filter by:
  - Country
  - Sector
  - Visa sponsorship (YES/NO/UNKNOWN)
  - Job type
- Search functionality
- Save/bookmark jobs
```

## Critical User Flows

### Flow 1: Work Abroad Assessment (5 screens)
1. **Intro** → Choose "Work Abroad" path
2. **Targeting** → Select country, job type, current status
3. **Experience & Education** → Years of experience, education level, domain
4. **Language & History** → Languages spoken, previous applications
5. **Results** → Match %, skill gaps, recommended next steps

### Flow 2: CV Builder ($5 Monetization)
1. **Intro** → "$5 CV Builder" offer
2. **Personal Details** → Name, country, phone, email, LinkedIn
3. **Work Experience** → Add multiple positions (with AI assist)
4. **Education** → University, degree, dates
5. **Skills & Availability** → Core skills, start date
6. **Languages** → Multiple languages with proficiency
7. **Download** → CV ready → Redirect to Jobs Feed

### Flow 3: CV Tailoring ($5 Monetization)
1. **Upload** → Upload existing CV + paste job description
2. **Analyzing** → AI processing (loading screen)
3. **Match Report** → Show % match, gaps, strengths
4. **Preview** → Locked tailored CV preview
5. **Payment** → $5 payment (MTN/Orange/Card)
6. **Confirmation** → Download tailored CV

### Flow 4: Skills Hub Registration
1. **Course Catalog** → Browse courses (IELTS, German, Tech)
2. **Course Details** → Curriculum modules
3. **Register** → Info session registration form
4. **Confirmation** → Calendar invite + email

## Mobile-First Design Principles

1. **Max-width**: 448px (md breakpoint)
2. **Touch targets**: Minimum 44px height
3. **Bottom CTAs**: Fixed buttons with gradient fade
4. **Dark mode default**: Better for African mobile data usage
5. **Progressive disclosure**: One question per screen
6. **Inline validation**: Real-time feedback
7. **Loading states**: Skeleton screens, progress bars
8. **Empty states**: Helpful illustrations

## Immediate Tasks

### Phase 1: Project Setup
1. Initialize Next.js 14 with TypeScript
2. Install dependencies (Tailwind, React Hook Form, Zod)
3. Set up folder structure
4. Configure Tailwind with custom theme
5. Add Inter font and Material Symbols

### Phase 2: Core Components
1. Create reusable UI components (Button, Input, Card, etc.)
2. Build progress bar component
3. Build multi-step form hook
4. Create layout components (Header, Bottom Nav)

### Phase 3: Onboarding & Path Selection
1. Splash screen
2. Path selection screen (3 cards)
3. Routing setup for each path

### Phase 4: Work Abroad Flow
1. Assessment intro
2. Targeting form (step 2/5)
3. Experience & education (step 3/5)
4. Language & history (step 4/5)
5. Results page with recommendations

### Phase 5: CV Builder Flow
1. Intro ($5 offer)
2. Multi-step form (6 steps)
3. Form data persistence
4. CV preview (locked)
5. Download page

### Phase 6: CV Tailoring Flow
1. Upload interface
2. AI analysis integration
3. Match report display
4. Payment integration
5. PDF generation

### Phase 7: Skills Hub
1. Hub welcome page
2. Course catalog grid
3. Individual course pages
4. Registration flow

### Phase 8: Jobs Feed
1. Jobs listing with filters
2. Job detail page
3. Search functionality
4. Save/bookmark feature

## Success Metrics to Track

1. **Conversion Rate**: % who complete Work Abroad assessment
2. **Payment Conversion**: % who pay $5 for CV services
3. **Course Registrations**: Info session sign-ups
4. **Job Applications**: External applications clicked
5. **User Retention**: Return visits within 7 days

## Notes for Development

- **Mobile-first**: All designs are mobile screens (375-414px width)
- **Dark mode priority**: Default to dark theme
- **Offline capability**: Consider service worker for forms
- **Performance**: Lazy load routes, optimize images
- **Analytics**: Track user flow drop-off points
- **A/B Testing**: Test different pricing ($5 vs $3)

## Getting Started

Please:
1. Create the Next.js project structure above
2. Set up Tailwind with the custom configuration
3. Create the basic routing structure
4. Build the core UI components library
5. Implement the splash screen and path selection

Once the foundation is ready, we'll build out each user flow systematically.