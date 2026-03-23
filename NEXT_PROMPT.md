Perfect! That's actually a much better choice since you're already using Supabase with SoundBridge. Let me restructure everything for Supabase.

## 🚀 GlobalReady with Supabase Backend

### 1. **Supabase Setup for React Native**

```bash
npm install @supabase/supabase-js
npm install react-native-url-polyfill
npm install @react-native-async-storage/async-storage
```

**Initialize Supabase Client:**
```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

### 2. **Database Schema (SQL)**

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Abroad Assessment Results
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_country TEXT NOT NULL,
  job_sector TEXT NOT NULL,
  years_experience INTEGER,
  education_level TEXT,
  languages JSONB, -- ["English", "French"]
  match_score INTEGER, -- 0-100
  skill_gaps JSONB, -- [{skill: "AWS", priority: "HIGH"}]
  status TEXT DEFAULT 'incomplete', -- incomplete | completed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CVs table (both built and tailored)
CREATE TABLE public.cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'built' | 'tailored'
  cv_data JSONB NOT NULL, -- Full CV JSON structure
  pdf_url TEXT, -- Supabase Storage URL
  job_description TEXT, -- For tailored CVs
  match_score INTEGER, -- For tailored CVs
  payment_status TEXT DEFAULT 'pending', -- pending | completed | failed
  payment_amount INTEGER, -- 500 (for $5)
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table (curated opportunities)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  country TEXT NOT NULL,
  job_type TEXT, -- full-time | contract | remote
  sector TEXT,
  visa_sponsorship TEXT, -- YES | NO | UNKNOWN
  requirements JSONB,
  description TEXT,
  apply_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT, -- IELTS | German | Tech | etc.
  description TEXT,
  duration_hours INTEGER,
  curriculum JSONB, -- [{module: "Basics", lessons: [...]}]
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Registrations (Info Session Sign-ups)
CREATE TABLE public.course_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending | confirmed | attended
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- in cents (500 = $5)
  currency TEXT DEFAULT 'USD',
  payment_method TEXT, -- paystack | flutterwave | stripe
  reference TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | successful | failed
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Jobs (Bookmarks)
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own assessments"
  ON public.assessments FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own CVs"
  ON public.cvs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active courses"
  ON public.courses FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage own course registrations"
  ON public.course_registrations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved jobs"
  ON public.saved_jobs FOR ALL
  USING (auth.uid() = user_id);
```

---

### 3. **Supabase Storage Setup**

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('cv-pdfs', 'cv-pdfs', false), -- Private bucket for CV PDFs
  ('uploaded-cvs', 'uploaded-cvs', false); -- User uploaded CVs

-- Storage policies
CREATE POLICY "Users can upload their own CVs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploaded-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own CV PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cv-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

### 4. **React Native Service Layer**

```typescript
// services/supabase/auth.ts
import { supabase } from '@/lib/supabase';

export const authService = {
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};
```

```typescript
// services/supabase/cvs.ts
import { supabase } from '@/lib/supabase';
import { CVData } from '@/types/cv';

export const cvService = {
  // Save CV data (builder flow)
  saveCVData: async (cvData: CVData) => {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('cvs')
      .insert({
        user_id: user.data.user?.id,
        type: 'built',
        cv_data: cvData,
        payment_status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's CVs
  getUserCVs: async () => {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Upload CV file (for tailoring)
  uploadCVFile: async (file: any, userId: string) => {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('uploaded-cvs')
      .upload(fileName, file);
    
    if (error) throw error;
    return data;
  },

  // Generate signed URL for CV download
  getDownloadURL: async (path: string) => {
    const { data, error } = await supabase.storage
      .from('cv-pdfs')
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) throw error;
    return data.signedUrl;
  }
};
```

```typescript
// services/supabase/jobs.ts
import { supabase } from '@/lib/supabase';

export const jobsService = {
  // Get all active jobs with filters
  getJobs: async (filters?: {
    country?: string;
    sector?: string;
    visaSponsorship?: string;
  }) => {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true);
    
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }
    if (filters?.sector) {
      query = query.eq('sector', filters.sector);
    }
    if (filters?.visaSponsorship) {
      query = query.eq('visa_sponsorship', filters.visaSponsorship);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Save/bookmark job
  saveJob: async (jobId: string) => {
    const user = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: user.data.user?.id,
        job_id: jobId
      });
    
    if (error) throw error;
  },

  // Get saved jobs
  getSavedJobs: async () => {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        *,
        jobs (*)
      `);
    
    if (error) throw error;
    return data;
  }
};
```

```typescript
// services/supabase/courses.ts
import { supabase } from '@/lib/supabase';

export const coursesService = {
  // Get all courses
  getCourses: async (category?: string) => {
    let query = supabase
      .from('courses')
      .select('*')
      .eq('is_active', true);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Register for info session
  registerForCourse: async (courseId: string, registrationData: {
    full_name: string;
    email: string;
    phone?: string;
    preferred_date?: string;
  }) => {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('course_registrations')
      .insert({
        user_id: user.data.user?.id,
        course_id: courseId,
        ...registrationData
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

---

### 5. **Supabase Edge Functions (for AI Processing)**

Since you can't run Anthropic API directly from React Native (API key exposure), use Supabase Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize functions
supabase functions new analyze-cv
supabase functions new tailor-cv
```

**Edge Function: analyze-cv**
```typescript
// supabase/functions/analyze-cv/index.ts
import Anthropic from '@anthropic-ai/sdk';

Deno.serve(async (req) => {
  try {
    const { cvText, jobDescription } = await req.json();
    
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this CV against the job description and return JSON:

CV:
${cvText}

Job Description:
${jobDescription}

Return JSON with:
{
  "match_score": <0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": [
    {"skill": "AWS", "priority": "HIGH", "reason": "Required for cloud deployments"}
  ],
  "ats_suggestions": ["Use bullet points", "Add keywords"],
  "overall_assessment": "Brief summary"
}`
      }]
    });

    const analysis = JSON.parse(message.content[0].text);
    
    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

**Edge Function: tailor-cv**
```typescript
// supabase/functions/tailor-cv/index.ts
import Anthropic from '@anthropic-ai/sdk';

Deno.serve(async (req) => {
  try {
    const { cvData, jobDescription } = await req.json();
    
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Rewrite this CV to match the job description. Optimize for ATS and include relevant keywords.

CV Data:
${JSON.stringify(cvData)}

Job Description:
${jobDescription}

Return the tailored CV data in the same JSON structure with improved content.`
      }]
    });

    const tailoredCV = JSON.parse(message.content[0].text);
    
    return new Response(JSON.stringify(tailoredCV), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
});
```

**Deploy Edge Functions:**
```bash
supabase functions deploy analyze-cv --project-ref your-project-ref
supabase functions deploy tailor-cv --project-ref your-project-ref
```

---

### 6. **Calling Edge Functions from React Native**

```typescript
// services/ai/cvAnalysis.ts
import { supabase } from '@/lib/supabase';

export const analyzeCVJobMatch = async (
  cvText: string,
  jobDescription: string
) => {
  const { data, error } = await supabase.functions.invoke('analyze-cv', {
    body: { cvText, jobDescription }
  });

  if (error) throw error;
  return data;
};

export const tailorCV = async (
  cvData: any,
  jobDescription: string
) => {
  const { data, error } = await supabase.functions.invoke('tailor-cv', {
    body: { cvData, jobDescription }
  });

  if (error) throw error;
  return data;
};
```

---

### 7. **Payment Integration with Supabase**

```typescript
// services/payment/paystack.ts
import { supabase } from '@/lib/supabase';

export const initializePayment = async (
  email: string,
  amount: number, // 500 for $5
  cvId: string
) => {
  const reference = `GR-${Date.now()}`;
  
  // 1. Create payment record in Supabase
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      cv_id: cvId,
      amount,
      reference,
      payment_method: 'paystack',
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // 2. Return reference for Paystack
  return { reference, paymentId: payment.id };
};

export const verifyPayment = async (reference: string) => {
  // Call your backend/edge function to verify with Paystack
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: { reference }
  });
  
  if (error) throw error;
  
  // Update payment status
  await supabase
    .from('payments')
    .update({ status: 'successful' })
    .eq('reference', reference);
  
  return data;
};
```

---

### 8. **Environment Variables (.env)**

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-key # For Edge Functions only
PAYSTACK_PUBLIC_KEY=your-paystack-key
```


