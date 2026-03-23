import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

export interface CourseFilters {
  category?: string;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  path_category: string;
  icon: string;
  tint_color: string;
  display_order: number;
  duration: string | null;
  level: string;
  syllabus: Array<{
    title: string;
    description: string;
    icon: string;
    accent: string;
  }>;
  is_active: boolean;
  featured: boolean;
}

export interface VirtualSession {
  id: string;
  course_id: string;
  title: string;
  session_date: string;
  duration_minutes: number;
  timezone: string;
  location: string;
  meeting_link: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  side_hustle: 'High Income Skills',
  tech_career: 'Tech Career Paths (6-12 Months)',
  language: 'Language Training',
};

const SECTION_ORDER = ['side_hustle', 'tech_career', 'language'];

export const coursesService = {
  getCourses: async (filters?: CourseFilters) => {
    let query = supabase.from('courses').select('*').eq('is_active', true);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query.order('featured', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getCoursesByPathCategory: async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, subtitle, icon, tint_color, path_category, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    const grouped: Record<string, typeof data> = {};
    for (const course of data ?? []) {
      const cat = course.path_category || 'tech_career';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(course);
    }

    return SECTION_ORDER
      .filter((key) => grouped[key]?.length)
      .map((key) => ({
        key,
        title: SECTION_LABELS[key] || key,
        items: grouped[key],
      }));
  },

  getCourseById: async (courseId: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) throw error;
    return data as Course;
  },

  getVirtualSession: async (courseId: string): Promise<VirtualSession | null> => {
    const { data, error } = await supabase
      .from('virtual_sessions')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .gte('session_date', new Date().toISOString())
      .order('session_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  registerForCourse: async (
    courseId: string,
    registrationData: {
      full_name: string;
      email: string;
      phone?: string;
      preferred_date?: string;
      occupation?: string;
      primary_goal?: string;
      consent?: boolean;
    }
  ) => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('course_registrations')
      .upsert(
        {
          user_id: user.data.user?.id,
          course_id: courseId,
          ...registrationData,
        },
        { onConflict: 'user_id,course_id' }
      )
      .select()
      .single();

    if (error) throw error;

    // Notify admin about the new registration (fire-and-forget)
    const { data: course } = await supabase
      .from('courses')
      .select('title, category')
      .eq('id', courseId)
      .single();

    fetch(`${supabaseUrl}/functions/v1/notify-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        type: 'new_registration',
        data: {
          full_name: registrationData.full_name,
          email: registrationData.email,
          phone: registrationData.phone,
          course_title: course?.title || 'Unknown',
          category: course?.category || 'N/A',
        },
      }),
    }).catch(() => undefined);

    return data;
  },
};
