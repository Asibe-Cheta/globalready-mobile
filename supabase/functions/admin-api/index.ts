import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

/** Verify the request has a valid admin key or service role key */
function verifyAdmin(req: Request): boolean {
  const adminKey = Deno.env.get('ADMIN_API_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const providedKey =
    req.headers.get('x-admin-key') ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!providedKey) return false;

  // Accept either the dedicated admin key or the service role key
  if (adminKey && providedKey === adminKey) return true;
  if (serviceRoleKey && providedKey === serviceRoleKey) return true;

  return false;
}

function getSupabase() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

function getStripe() {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET');
  if (!stripeSecret) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
}

function getUserIdFromMetadata(
  metadata: Record<string, string> | null | undefined
): string | null {
  if (!metadata) return null;
  return (
    metadata.user_id ||
    metadata.userId ||
    metadata.uid ||
    metadata.supabase_user_id ||
    metadata.supabaseUserId ||
    null
  );
}

async function buildEmailToUserIdMap(supabase: ReturnType<typeof createClient>): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  let page = 1;
  const perPage = 1000;

  while (true) {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!users?.length) break;

    for (const user of users) {
      const email = user.email?.toLowerCase();
      if (email) map[email] = user.id;
    }

    if (users.length < perPage) break;
    page++;
  }

  return map;
}

// ============================================================
// Route handlers
// ============================================================

// --- COURSES ---

async function getCourses(url: URL) {
  const supabase = getSupabase();
  const category = url.searchParams.get('category');
  const includeInactive = url.searchParams.get('include_inactive') === 'true';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('courses')
    .select('*, course_registrations(count)', { count: 'exact' });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }
  if (category) {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({
    courses: data,
    pagination: { page, limit, total: count || 0 },
  });
}

async function getCourseById(id: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('courses')
    .select('*, course_registrations(id, full_name, email, phone, status, created_at)')
    .eq('id', id)
    .single();

  if (error) return errorResponse(error.message, error.code === 'PGRST116' ? 404 : 500);

  return jsonResponse(data);
}

async function createCourse(body: any) {
  const supabase = getSupabase();

  const {
    title, subtitle, description, category, duration, duration_hours,
    total_lessons, image_url, thumbnail_url, instructor, instructor_avatar,
    price, currency, level, syllabus, prerequisites, learning_outcomes,
    tags, featured, is_active,
  } = body;

  if (!title) return errorResponse('Title is required');

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title,
      subtitle: subtitle || null,
      description: description || null,
      category: category || null,
      duration: duration || null,
      duration_hours: duration_hours || 0,
      total_lessons: total_lessons || 0,
      image_url: image_url || null,
      thumbnail_url: thumbnail_url || null,
      instructor: instructor || null,
      instructor_avatar: instructor_avatar || null,
      price: price || 0,
      currency: currency || 'USD',
      level: level || 'beginner',
      syllabus: syllabus || [],
      prerequisites: prerequisites || [],
      learning_outcomes: learning_outcomes || [],
      tags: tags || [],
      featured: featured || false,
      is_active: is_active !== false,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data, 201);
}

async function updateCourse(id: string, body: any) {
  const supabase = getSupabase();

  // Only include fields that are actually provided
  const updates: Record<string, any> = {};
  const fields = [
    'title', 'subtitle', 'description', 'category', 'duration', 'duration_hours',
    'total_lessons', 'image_url', 'thumbnail_url', 'instructor', 'instructor_avatar',
    'price', 'currency', 'level', 'syllabus', 'prerequisites', 'learning_outcomes',
    'tags', 'featured', 'is_active',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('No fields to update');
  }

  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data);
}

async function deleteCourse(id: string) {
  const supabase = getSupabase();

  // Soft delete — just set is_active = false
  const { data, error } = await supabase
    .from('courses')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ success: true, course: data });
}

// --- DASHBOARD ---

async function getDashboardStats() {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data);
}

async function getRevenueOverTime(url: URL) {
  const supabase = getSupabase();
  const days = parseInt(url.searchParams.get('days') || '30');

  const { data, error } = await supabase.rpc('admin_revenue_over_time', { days_back: days });
  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data || []);
}

async function getSkillsInsights() {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('admin_skills_insights');
  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data);
}

async function getUserGrowth(url: URL) {
  const supabase = getSupabase();
  const days = parseInt(url.searchParams.get('days') || '30');

  const { data, error } = await supabase.rpc('admin_user_growth', { days_back: days });
  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data || []);
}

// --- USERS ---

async function getUsers(url: URL) {
  const supabase = getSupabase();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search');

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, phone, country, avatar_url, created_at, updated_at', { count: 'exact' });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: profiles, error: profilesError, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (profilesError) return errorResponse(profilesError.message, 500);

  // Enrich with CV count and payment info
  const userIds = (profiles || []).map((p: any) => p.id);

  const [cvsResult, paymentsResult, registrationsResult] = await Promise.all([
    supabase
      .from('cvs')
      .select('user_id')
      .in('user_id', userIds),
    supabase
      .from('payments')
      .select('user_id, amount, status')
      .in('user_id', userIds)
      .eq('status', 'successful'),
    supabase
      .from('course_registrations')
      .select('user_id')
      .in('user_id', userIds),
  ]);

  const cvCounts: Record<string, number> = {};
  const paymentTotals: Record<string, number> = {};
  const registrationCounts: Record<string, number> = {};

  for (const cv of cvsResult.data || []) {
    cvCounts[cv.user_id] = (cvCounts[cv.user_id] || 0) + 1;
  }
  for (const p of paymentsResult.data || []) {
    paymentTotals[p.user_id] = (paymentTotals[p.user_id] || 0) + p.amount;
  }
  for (const r of registrationsResult.data || []) {
    registrationCounts[r.user_id] = (registrationCounts[r.user_id] || 0) + 1;
  }

  const enrichedUsers = (profiles || []).map((user: any) => ({
    ...user,
    cv_count: cvCounts[user.id] || 0,
    total_spent: paymentTotals[user.id] || 0,
    course_registrations: registrationCounts[user.id] || 0,
  }));

  return jsonResponse({
    users: enrichedUsers,
    pagination: { page, limit, total: count || 0 },
  });
}

async function getUserById(id: string) {
  const supabase = getSupabase();

  const [profileResult, cvsResult, paymentsResult, registrationsResult, assessmentResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('cvs').select('id, type, payment_status, created_at').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('course_registrations').select('*, courses(title, category)').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('assessments').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (profileResult.error) return errorResponse(profileResult.error.message, 404);

  return jsonResponse({
    profile: profileResult.data,
    cvs: cvsResult.data || [],
    payments: paymentsResult.data || [],
    registrations: registrationsResult.data || [],
    assessment: assessmentResult.data,
  });
}

// --- PAYMENTS ---

async function getPayments(url: URL) {
  const supabase = getSupabase();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status');

  let query = supabase
    .from('payments')
    .select('*, profiles:user_id(full_name, email)', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({
    payments: data,
    pagination: { page, limit, total: count || 0 },
  });
}

// --- REGISTRATIONS ---

async function getRegistrations(url: URL) {
  const supabase = getSupabase();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const courseId = url.searchParams.get('course_id');

  let query = supabase
    .from('course_registrations')
    .select('*, courses(title, category)', { count: 'exact' });

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({
    registrations: data,
    pagination: { page, limit, total: count || 0 },
  });
}

async function updateRegistrationStatus(id: string, body: any) {
  const supabase = getSupabase();
  const { status, completed_at } = body;

  const updates: Record<string, any> = {};
  if (status) updates.status = status;
  if (completed_at) updates.completed_at = completed_at;
  if (status === 'completed' && !completed_at) updates.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('course_registrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data);
}

// --- JOBS ---

async function getAdminJobs(url: URL) {
  const supabase = getSupabase();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const includeInactive = url.searchParams.get('include_inactive') === 'true';
  const country = url.searchParams.get('country');
  const sector = url.searchParams.get('sector');
  const search = url.searchParams.get('search');

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }
  if (country) {
    query = query.eq('country', country);
  }
  if (sector) {
    query = query.eq('sector', sector);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({
    jobs: data,
    pagination: { page, limit, total: count || 0 },
  });
}

async function getAdminJobById(id: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return errorResponse(error.message, error.code === 'PGRST116' ? 404 : 500);

  return jsonResponse(data);
}

async function createJob(body: any) {
  const supabase = getSupabase();

  const {
    title, company, company_logo_url, country, city, job_type, sector,
    visa_sponsorship, salary_range, requirements, description, apply_url,
    posted_date, expires_at, is_active, is_featured,
  } = body;

  if (!title) return errorResponse('Title is required');
  if (!company) return errorResponse('Company is required');

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      title,
      company,
      company_logo_url: company_logo_url || null,
      country: country || null,
      city: city || null,
      job_type: job_type || 'Full-time',
      sector: sector || null,
      visa_sponsorship: visa_sponsorship || 'UNKNOWN',
      salary_range: salary_range || null,
      requirements: requirements || {},
      description: description || null,
      apply_url: apply_url || null,
      posted_date: posted_date || new Date().toISOString(),
      expires_at: expires_at || null,
      is_active: is_active !== false,
      is_featured: is_featured || false,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data, 201);
}

async function updateJob(id: string, body: any) {
  const supabase = getSupabase();

  const updates: Record<string, any> = {};
  const fields = [
    'title', 'company', 'company_logo_url', 'country', 'city', 'job_type',
    'sector', 'visa_sponsorship', 'salary_range', 'requirements', 'description',
    'apply_url', 'posted_date', 'expires_at', 'is_active', 'is_featured',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('No fields to update');
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data);
}

async function deleteJob(id: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ success: true, job: data });
}

// --- IN-DEMAND ROLES ---

async function getInDemandRoles(url: URL) {
  const supabase = getSupabase();
  const includeInactive = url.searchParams.get('include_inactive') === 'true';

  let query = supabase
    .from('in_demand_roles')
    .select('*');

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('rank', { ascending: true });

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ roles: data });
}

async function createInDemandRole(body: any) {
  const supabase = getSupabase();

  const { rank, title, icon, accent_color, reason, is_active } = body;

  if (!title) return errorResponse('Title is required');
  if (rank === undefined) return errorResponse('Rank is required');

  const { data, error } = await supabase
    .from('in_demand_roles')
    .insert({
      rank,
      title,
      icon: icon || 'code',
      accent_color: accent_color || '#3b82f6',
      reason: reason || '',
      is_active: is_active !== false,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data, 201);
}

async function updateInDemandRole(id: string, body: any) {
  const supabase = getSupabase();

  const updates: Record<string, any> = {};
  const fields = ['rank', 'title', 'icon', 'accent_color', 'reason', 'is_active'];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('No fields to update');
  }

  const { data, error } = await supabase
    .from('in_demand_roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data);
}

async function deleteInDemandRole(id: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('in_demand_roles')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ success: true, role: data });
}

// --- ASSESSMENTS ---

async function getAssessments(url: URL) {
  const supabase = getSupabase();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status');

  let query = supabase
    .from('assessments')
    .select('id, user_id, target_country, job_sector, current_status, years_experience, education_level, match_score, eligibility_status, status, created_at, profiles:user_id(full_name, email)', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({
    assessments: data,
    pagination: { page, limit, total: count || 0 },
  });
}

// --- SUBSCRIPTIONS ---

async function getSubscribedUsers(url: URL) {
  const supabase = getSupabase();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const nowIso = new Date().toISOString();

  const { data, error, count } = await supabase
    .from('subscriptions')
    .select(
      'user_id,status,current_period_end,cancel_at_period_end,stripe_customer_id,stripe_subscription_id,updated_at,profiles:user_id(id,full_name,email,country)',
      { count: 'exact' }
    )
    .in('status', ['active', 'trialing'])
    .gt('current_period_end', nowIso)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({
    subscriptions: data || [],
    pagination: { page, limit, total: count || 0 },
  });
}

async function getSubscriptionIssues(url: URL) {
  const supabase = getSupabase();
  const stripe = getStripe();
  const sampleLimit = Math.min(parseInt(url.searchParams.get('sample_limit') || '100'), 500);

  const emailToUserId = await buildEmailToUserIdMap(supabase);
  const stripeActiveUserIds = new Set<string>();
  let stripeActiveCount = 0;
  const unmatchedStripeActive: Array<{
    subscription_id: string;
    customer_id: string | null;
    email: string | null;
    status: string;
  }> = [];

  let startingAfter: string | undefined;
  while (true) {
    const page = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.customer'],
    });

    for (const sub of page.data) {
      if (sub.status !== 'active' && sub.status !== 'trialing') continue;
      stripeActiveCount++;

      const customer = typeof sub.customer === 'string' ? null : sub.customer;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
      const customerEmail = customer && !customer.deleted ? customer.email?.toLowerCase() ?? null : null;

      const metadataUserId = getUserIdFromMetadata(sub.metadata);
      const customerMetadataUserId =
        customer && !customer.deleted ? getUserIdFromMetadata(customer.metadata as Record<string, string>) : null;

      const userId = metadataUserId || customerMetadataUserId || (customerEmail ? emailToUserId[customerEmail] : null);

      if (userId) {
        stripeActiveUserIds.add(userId);
      } else if (unmatchedStripeActive.length < sampleLimit) {
        unmatchedStripeActive.push({
          subscription_id: sub.id,
          customer_id: customerId,
          email: customerEmail,
          status: sub.status,
        });
      }
    }

    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  const nowIso = new Date().toISOString();
  const { data: dbSubs, error: dbError } = await supabase
    .from('subscriptions')
    .select('user_id,status,current_period_end,stripe_subscription_id,updated_at')
    .in('status', ['active', 'trialing'])
    .gt('current_period_end', nowIso);
  if (dbError) return errorResponse(dbError.message, 500);

  const dbProUserIds = new Set<string>((dbSubs || []).map((r: any) => r.user_id));
  const inStripeNotInDb = [...stripeActiveUserIds].filter((id) => !dbProUserIds.has(id));
  const inDbNotInStripe = (dbSubs || []).filter((row: any) => !stripeActiveUserIds.has(row.user_id));

  const userIdsForLookup = Array.from(
    new Set([...inStripeNotInDb, ...inDbNotInStripe.map((r: any) => r.user_id)])
  );
  let profilesById: Record<string, any> = {};
  if (userIdsForLookup.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name,email,country')
      .in('id', userIdsForLookup);
    profilesById = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
  }

  return jsonResponse({
    summary: {
      stripe_active_subscriptions: stripeActiveCount,
      stripe_active_users_mapped: stripeActiveUserIds.size,
      db_pro_users: dbProUserIds.size,
      in_stripe_not_in_db_count: inStripeNotInDb.length,
      in_db_not_in_stripe_count: inDbNotInStripe.length,
      unmatched_stripe_active_count: unmatchedStripeActive.length,
    },
    issues: {
      in_stripe_not_in_db: inStripeNotInDb.slice(0, sampleLimit).map((userId) => ({
        user_id: userId,
        profile: profilesById[userId] || null,
      })),
      in_db_not_in_stripe: inDbNotInStripe.slice(0, sampleLimit).map((row: any) => ({
        ...row,
        profile: profilesById[row.user_id] || null,
      })),
      unmatched_stripe_active: unmatchedStripeActive,
    },
  });
}

// ============================================================
// Router
// ============================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify admin authentication
  if (!verifyAdmin(req)) {
    return errorResponse('Unauthorized. Provide a valid x-admin-key header.', 401);
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-api\/?/, '').replace(/\/$/, '');
  const method = req.method;

  try {
    let body: any = {};
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      body = await req.json().catch(() => ({}));
    }

    // --- COURSES ---
    if (path === 'courses' && method === 'GET') {
      return getCourses(url);
    }
    if (path.match(/^courses\/[a-f0-9-]+$/) && method === 'GET') {
      const id = path.split('/')[1];
      return getCourseById(id);
    }
    if (path === 'courses' && method === 'POST') {
      return createCourse(body);
    }
    if (path.match(/^courses\/[a-f0-9-]+$/) && (method === 'PUT' || method === 'PATCH')) {
      const id = path.split('/')[1];
      return updateCourse(id, body);
    }
    if (path.match(/^courses\/[a-f0-9-]+$/) && method === 'DELETE') {
      const id = path.split('/')[1];
      return deleteCourse(id);
    }

    // --- DASHBOARD ---
    if (path === 'dashboard/stats' && method === 'GET') {
      return getDashboardStats();
    }
    if (path === 'dashboard/revenue' && method === 'GET') {
      return getRevenueOverTime(url);
    }
    if (path === 'dashboard/skills' && method === 'GET') {
      return getSkillsInsights();
    }
    if (path === 'dashboard/user-growth' && method === 'GET') {
      return getUserGrowth(url);
    }

    // --- USERS ---
    if (path === 'users' && method === 'GET') {
      return getUsers(url);
    }
    if (path.match(/^users\/[a-f0-9-]+$/) && method === 'GET') {
      const id = path.split('/')[1];
      return getUserById(id);
    }

    // --- PAYMENTS ---
    if (path === 'payments' && method === 'GET') {
      return getPayments(url);
    }

    // --- REGISTRATIONS ---
    if (path === 'registrations' && method === 'GET') {
      return getRegistrations(url);
    }
    if (path.match(/^registrations\/[a-f0-9-]+$/) && (method === 'PUT' || method === 'PATCH')) {
      const id = path.split('/')[1];
      return updateRegistrationStatus(id, body);
    }

    // --- JOBS ---
    if (path === 'jobs' && method === 'GET') {
      return getAdminJobs(url);
    }
    if (path.match(/^jobs\/[a-f0-9-]+$/) && method === 'GET') {
      const id = path.split('/')[1];
      return getAdminJobById(id);
    }
    if (path === 'jobs' && method === 'POST') {
      return createJob(body);
    }
    if (path.match(/^jobs\/[a-f0-9-]+$/) && (method === 'PUT' || method === 'PATCH')) {
      const id = path.split('/')[1];
      return updateJob(id, body);
    }
    if (path.match(/^jobs\/[a-f0-9-]+$/) && method === 'DELETE') {
      const id = path.split('/')[1];
      return deleteJob(id);
    }

    // --- IN-DEMAND ROLES ---
    if (path === 'in-demand-roles' && method === 'GET') {
      return getInDemandRoles(url);
    }
    if (path.match(/^in-demand-roles\/[a-f0-9-]+$/) && method === 'GET') {
      const id = path.replace('in-demand-roles/', '');
      const supabase = getSupabase();
      const { data, error } = await supabase.from('in_demand_roles').select('*').eq('id', id).single();
      if (error) return errorResponse(error.message, error.code === 'PGRST116' ? 404 : 500);
      return jsonResponse(data);
    }
    if (path === 'in-demand-roles' && method === 'POST') {
      return createInDemandRole(body);
    }
    if (path.match(/^in-demand-roles\/[a-f0-9-]+$/) && (method === 'PUT' || method === 'PATCH')) {
      const id = path.replace('in-demand-roles/', '');
      return updateInDemandRole(id, body);
    }
    if (path.match(/^in-demand-roles\/[a-f0-9-]+$/) && method === 'DELETE') {
      const id = path.replace('in-demand-roles/', '');
      return deleteInDemandRole(id);
    }

    // --- ASSESSMENTS ---
    if (path === 'assessments' && method === 'GET') {
      return getAssessments(url);
    }

    // --- SUBSCRIPTIONS ---
    if (path === 'subscriptions/subscribed-users' && method === 'GET') {
      return getSubscribedUsers(url);
    }
    if (path === 'subscriptions/issues' && method === 'GET') {
      return getSubscriptionIssues(url);
    }

    return errorResponse(`Route not found: ${method} /${path}`, 404);
  } catch (error: any) {
    console.error('Admin API error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
