# GlobalReady Admin API Documentation

## Base URL

```
https://bwgqzoplcgxguylerqsn.supabase.co/functions/v1/admin-api
```

## Authentication

All requests must include an `x-admin-key` header with the admin API key.

```
x-admin-key: <ADMIN_API_KEY>
```

Alternatively, you can pass the Supabase service role key as a Bearer token:

```
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

### Setting up the Admin API Key

Set the `ADMIN_API_KEY` secret on the Supabase project:

```bash
supabase secrets set ADMIN_API_KEY=your-secure-admin-key --project-ref bwgqzoplcgxguylerqsn
```

---

## Endpoints

### 1. Dashboard

#### GET `/dashboard/stats`

Returns aggregated dashboard statistics.

**Response:**
```json
{
  "total_users": 150,
  "active_users_30d": 45,
  "total_revenue": 25000,
  "total_orders": 50,
  "total_cvs": 120,
  "cvs_paid": 50,
  "total_enrollments": 80,
  "total_courses": 12,
  "total_assessments": 35,
  "avg_order_value": 500,
  "conversion_rate": 33.3
}
```

> Note: `total_revenue`, `avg_order_value`, and amounts are in **cents** (divide by 100 for dollars).

---

#### GET `/dashboard/revenue?days=30`

Returns revenue grouped by day.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `days` | integer | 30 | Number of days to look back |

**Response:**
```json
[
  { "date": "2026-01-15", "revenue": 1500, "orders": 3 },
  { "date": "2026-01-16", "revenue": 500, "orders": 1 }
]
```

---

#### GET `/dashboard/user-growth?days=30`

Returns new user signups grouped by day.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `days` | integer | 30 | Number of days to look back |

**Response:**
```json
[
  { "date": "2026-01-15", "new_users": 5 },
  { "date": "2026-01-16", "new_users": 3 }
]
```

---

#### GET `/dashboard/skills`

Returns skills and learning insights.

**Response:**
```json
{
  "total_skills_tracked": 45,
  "active_learners": 23,
  "path_distribution": [
    { "selected_path": "remote_work", "count": 15 },
    { "selected_path": "relocate", "count": 10 },
    { "selected_path": "side_income", "count": 8 }
  ],
  "course_popularity": [
    {
      "id": "uuid",
      "title": "IELTS Preparation",
      "category": "IELTS",
      "enrollments": 25,
      "completed": 10,
      "completion_rate": 40.0
    }
  ]
}
```

---

### 2. Courses (CRUD)

#### GET `/courses`

List all courses with enrollment counts.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page |
| `category` | string | — | Filter by category |
| `include_inactive` | boolean | false | Include deactivated courses |

**Response:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "IELTS Preparation Course",
      "subtitle": "Achieve Band 7+ in 8 weeks",
      "description": "Comprehensive IELTS prep...",
      "category": "IELTS",
      "duration": "8 weeks",
      "duration_hours": 40,
      "total_lessons": 32,
      "image_url": "https://...",
      "thumbnail_url": "https://...",
      "instructor": "Jane Smith",
      "instructor_avatar": "https://...",
      "price": 9900,
      "currency": "USD",
      "level": "intermediate",
      "syllabus": [
        { "week": 1, "title": "Listening", "topics": ["..."] }
      ],
      "prerequisites": ["Basic English"],
      "learning_outcomes": ["Score Band 7+"],
      "tags": ["ielts", "english", "test-prep"],
      "featured": true,
      "is_active": true,
      "enrollment_count": 25,
      "rating": 4.5,
      "rating_count": 12,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-15T00:00:00Z",
      "course_registrations": [{ "count": 25 }]
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 12 }
}
```

---

#### GET `/courses/:id`

Get a single course with its registrations.

**Response:**
```json
{
  "id": "uuid",
  "title": "IELTS Preparation Course",
  "...all course fields...",
  "course_registrations": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "registered",
      "created_at": "2026-01-10T00:00:00Z"
    }
  ]
}
```

---

#### POST `/courses`

Create a new course.

**Body:**
```json
{
  "title": "Data Analysis with Python",
  "subtitle": "From zero to job-ready",
  "description": "Learn data analysis...",
  "category": "Tech",
  "duration": "12 weeks",
  "duration_hours": 60,
  "total_lessons": 48,
  "image_url": "https://...",
  "thumbnail_url": "https://...",
  "instructor": "Dr. Smith",
  "instructor_avatar": "https://...",
  "price": 14900,
  "currency": "USD",
  "level": "beginner",
  "syllabus": [
    { "week": 1, "title": "Python Basics", "topics": ["variables", "loops"] }
  ],
  "prerequisites": [],
  "learning_outcomes": ["Analyze datasets", "Build dashboards"],
  "tags": ["python", "data", "analytics"],
  "featured": false,
  "is_active": true
}
```

**Required fields:** `title`
**All other fields are optional with sensible defaults.**

**Response:** `201` with the created course object.

---

#### PUT/PATCH `/courses/:id`

Update a course. Only include fields you want to change.

**Body:**
```json
{
  "price": 12900,
  "featured": true,
  "description": "Updated description..."
}
```

**Response:** Updated course object.

---

#### DELETE `/courses/:id`

Soft-deletes a course (sets `is_active = false`).

**Response:**
```json
{ "success": true, "course": { "...": "..." } }
```

---

### 3. Users

#### GET `/users`

List users with CV count, total spent, and course registrations.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page |
| `search` | string | — | Search by name or email |

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "country": "Nigeria",
      "avatar_url": "https://...",
      "created_at": "2026-01-01T00:00:00Z",
      "cv_count": 3,
      "total_spent": 1500,
      "course_registrations": 2
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 150 }
}
```

---

#### GET `/users/:id`

Get detailed user profile with CVs, payments, registrations, and assessment.

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "country": "Nigeria",
    "avatar_url": "https://...",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "cvs": [
    { "id": "uuid", "type": "built", "payment_status": "paid", "created_at": "..." }
  ],
  "payments": [
    { "id": "uuid", "amount": 500, "currency": "USD", "status": "successful", "reference": "cs_...", "created_at": "..." }
  ],
  "registrations": [
    { "id": "uuid", "full_name": "John Doe", "email": "john@example.com", "courses": { "title": "IELTS Prep", "category": "IELTS" }, "created_at": "..." }
  ],
  "assessment": {
    "target_country": "Germany",
    "job_sector": "Technology",
    "match_score": 72,
    "eligibility_status": "strong"
  }
}
```

---

### 4. Payments

#### GET `/payments`

List all payments with user info.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page |
| `status` | string | — | Filter: `pending`, `successful` |

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "cv_id": "uuid",
      "amount": 500,
      "currency": "USD",
      "payment_method": "stripe",
      "reference": "cs_test_...",
      "status": "successful",
      "metadata": { "checkout_session_id": "cs_test_..." },
      "created_at": "2026-01-15T00:00:00Z",
      "profiles": {
        "full_name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 50 }
}
```

---

### 5. Course Registrations

#### GET `/registrations`

List all course registrations.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page |
| `course_id` | string | — | Filter by course UUID |

**Response:**
```json
{
  "registrations": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "course_id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "occupation": "Software Engineer",
      "primary_goal": "Relocate abroad",
      "status": "registered",
      "consent": true,
      "created_at": "2026-01-10T00:00:00Z",
      "courses": { "title": "IELTS Prep", "category": "IELTS" }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 80 }
}
```

---

#### PUT/PATCH `/registrations/:id`

Update a registration's status.

**Body:**
```json
{
  "status": "completed",
  "completed_at": "2026-02-01T00:00:00Z"
}
```

Status values: `registered`, `in_progress`, `completed`, `cancelled`

If `status` is `completed` and `completed_at` is not provided, it defaults to now.

---

### 6. Assessments

#### GET `/assessments`

List user assessments.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page |
| `status` | string | — | Filter: `incomplete`, `completed` |

**Response:**
```json
{
  "assessments": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "target_country": "Germany",
      "job_sector": "Technology",
      "current_status": "employed",
      "years_experience": 5,
      "education_level": "bachelors",
      "match_score": 72,
      "eligibility_status": "strong",
      "status": "completed",
      "created_at": "2026-01-01T00:00:00Z",
      "profiles": {
        "full_name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 35 }
}
```

---

## Admin Email Notifications

The mobile app automatically sends email notifications to admin(s) for:

1. **New user signups** — Name, email
2. **Course registrations** — Student name, email, phone, course title
3. **Successful payments** — Amount, customer email, reference, service type

### Configure Admin Emails

Update admin emails in the `admin_settings` table:

```sql
UPDATE admin_settings
SET value = '["admin@globalready.tech", "team@globalready.tech"]'
WHERE key = 'admin_emails';
```

---

## Deployment

### Deploy edge functions

```bash
# Deploy admin API
supabase functions deploy admin-api --project-ref bwgqzoplcgxguylerqsn

# Deploy admin notification function
supabase functions deploy notify-admin --project-ref bwgqzoplcgxguylerqsn
```

### Set secrets

```bash
supabase secrets set ADMIN_API_KEY=your-secure-admin-key --project-ref bwgqzoplcgxguylerqsn
```

### Run SQL migration

Copy the contents of `supabase/migrations/admin_api_setup.sql` and run it in the Supabase SQL Editor at:
https://supabase.com/dashboard/project/bwgqzoplcgxguylerqsn/sql

---

## Example: Admin Dashboard Integration (JavaScript/TypeScript)

```typescript
const ADMIN_API_BASE = 'https://bwgqzoplcgxguylerqsn.supabase.co/functions/v1/admin-api';
const ADMIN_KEY = process.env.ADMIN_API_KEY;

async function fetchDashboardStats() {
  const res = await fetch(`${ADMIN_API_BASE}/dashboard/stats`, {
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  return res.json();
}

async function createCourse(courseData) {
  const res = await fetch(`${ADMIN_API_BASE}/courses`, {
    method: 'POST',
    headers: {
      'x-admin-key': ADMIN_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(courseData),
  });
  return res.json();
}

async function getUsers(page = 1, search = '') {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);

  const res = await fetch(`${ADMIN_API_BASE}/users?${params}`, {
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  return res.json();
}
```

---

## Course Fields Reference

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | — | Course title |
| `subtitle` | string | No | null | Short tagline |
| `description` | string | No | null | Full description |
| `category` | string | No | null | e.g. "IELTS", "Tech", "German", "Business" |
| `duration` | string | No | null | Human-readable, e.g. "8 weeks" |
| `duration_hours` | number | No | 0 | Total hours of content |
| `total_lessons` | integer | No | 0 | Number of lessons |
| `image_url` | string | No | null | Full-size image |
| `thumbnail_url` | string | No | null | Card thumbnail |
| `instructor` | string | No | null | Instructor name |
| `instructor_avatar` | string | No | null | Instructor photo URL |
| `price` | integer | No | 0 | Price in cents (0 = free) |
| `currency` | string | No | "USD" | Currency code |
| `level` | string | No | "beginner" | "beginner", "intermediate", "advanced" |
| `syllabus` | JSON array | No | [] | Week/module breakdown |
| `prerequisites` | string[] | No | [] | Required prior knowledge |
| `learning_outcomes` | string[] | No | [] | What students will learn |
| `tags` | string[] | No | [] | Search/filter tags |
| `featured` | boolean | No | false | Show in featured section |
| `is_active` | boolean | No | true | Visible to users |
| `enrollment_count` | integer | Auto | 0 | Number of enrollments |
| `rating` | number | Auto | 0 | Average rating |
| `rating_count` | integer | Auto | 0 | Number of ratings |
