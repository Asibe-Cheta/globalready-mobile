# Web Team: Jobs & In-Demand Roles — Setup Guide

## Overview

The mobile app's "Browse Jobs" flow is now fully wired to the database. The admin can manage **jobs** and **in-demand tech roles** through the same admin API used for courses. Users can search, filter, save jobs, and view full details — all from real data.

This document covers what you need to run and how to use the new admin endpoints.

---

## Step 1: Run the SQL Migration

Open the **Supabase SQL Editor** and run the contents of `JOBS_DATABASE_SETUP.sql` (located in the project root).

This script does the following:

| What | Details |
|------|---------|
| Creates `in_demand_roles` table | UUID id, rank, title, icon, accent_color, reason, is_active, timestamps |
| Enables RLS on `in_demand_roles` | Public read for active roles only |
| Seeds 10 in-demand roles | The current "Top 10 In-Demand Tech Roles" list |
| Adds RLS policies on `jobs` | Public SELECT for active jobs |
| Adds RLS policies on `saved_jobs` | Authenticated users can INSERT/SELECT/DELETE their own rows |
| Creates `increment_job_views()` RPC | Increments view_count when a user opens a job |
| Creates `increment_job_applications()` RPC | Increments application_count when a user clicks "Apply" |

**Important:** The `jobs` and `saved_jobs` tables should already exist. If not, check that your Supabase project has them. The SQL only adds RLS policies if they don't already exist.

---

## Step 2: Deploy the Admin API Edge Function

Run this from the project root (requires Supabase CLI login):

```bash
npx supabase login
npx supabase functions deploy admin-api --project-ref bwgqzoplcgxguylerqsn
```

The updated admin-api now includes Jobs CRUD and In-Demand Roles CRUD alongside the existing Courses/Registrations/Assessments endpoints.

---

## Step 3: Admin API — Jobs Endpoints

All requests require the `x-admin-key` header (same key used for courses).

Base URL: `https://bwgqzoplcgxguylerqsn.supabase.co/functions/v1/admin-api`

### List Jobs

```
GET /admin-api/jobs?page=1&limit=50
```

Optional query params:
- `page` (default: 1)
- `limit` (default: 50)
- `country` — filter by country (e.g., `Germany`)
- `sector` — filter by sector (e.g., `Technology`)
- `search` — search title or company name
- `include_inactive=true` — include soft-deleted jobs

Response:
```json
{
  "jobs": [...],
  "pagination": { "page": 1, "limit": 50, "total": 123 }
}
```

### Get Single Job

```
GET /admin-api/jobs/:id
```

### Create Job

```
POST /admin-api/jobs
Content-Type: application/json

{
  "title": "Senior Backend Engineer",        // required
  "company": "CloudFlow Tech",               // required
  "country": "Germany",
  "city": "Berlin",
  "job_type": "Remote",                      // e.g., Remote, On-site, Hybrid
  "sector": "Technology",
  "visa_sponsorship": "YES",                 // YES, NO, or UNKNOWN
  "salary_range": "$90k - $130k",
  "description": "Build scalable microservices...",
  "apply_url": "https://company.com/apply",
  "posted_date": "2026-02-10T00:00:00Z",    // defaults to now
  "expires_at": null,
  "is_active": true,                         // defaults to true
  "is_featured": false,                      // defaults to false
  "requirements": {                          // JSONB — optional
    "responsibilities": [
      "Design and implement REST APIs",
      "Lead code reviews and mentor junior devs"
    ],
    "requirements": [
      "5+ years backend experience",
      "Proficient in Node.js or Python"
    ],
    "experience_level": "Mid-Senior",        // shown in Reality Check card
    "competition_level": "HIGH"              // HIGH, MEDIUM, or LOW
  }
}
```

### Update Job

```
PUT /admin-api/jobs/:id
Content-Type: application/json

{
  "salary_range": "$100k - $140k",
  "is_featured": true
}
```

Only include the fields you want to change (partial update).

### Delete Job (Soft Delete)

```
DELETE /admin-api/jobs/:id
```

Sets `is_active = false`. The job will no longer appear in the mobile app feed.

---

## Step 4: Admin API — In-Demand Roles Endpoints

These manage the "Top 10 In-Demand Tech Roles" list shown on the mobile app.

### List Roles

```
GET /admin-api/in-demand-roles
```

Optional: `?include_inactive=true`

Response:
```json
{
  "roles": [
    {
      "id": "uuid",
      "rank": 1,
      "title": "Software Developer",
      "icon": "code",
      "accent_color": "#3b82f6",
      "reason": "Critical for building and maintaining...",
      "is_active": true
    }
  ]
}
```

### Get Single Role

```
GET /admin-api/in-demand-roles/:id
```

### Create Role

```
POST /admin-api/in-demand-roles
Content-Type: application/json

{
  "rank": 11,                                // required — display order
  "title": "Blockchain Developer",           // required
  "icon": "currency-bitcoin",                // MaterialIcons name
  "accent_color": "#f59e0b",                 // hex color for the icon badge
  "reason": "Web3 and DeFi demand continues to grow...",
  "is_active": true
}
```

### Update Role

```
PUT /admin-api/in-demand-roles/:id
Content-Type: application/json

{
  "rank": 5,
  "reason": "Updated reasoning text..."
}
```

### Delete Role (Soft Delete)

```
DELETE /admin-api/in-demand-roles/:id
```

---

## Step 5: Icon Reference for In-Demand Roles

The `icon` field must be a valid [MaterialIcons](https://fonts.google.com/icons) name. Here are the ones currently used:

| Role | Icon Name |
|------|-----------|
| Software Developer | `code` |
| Data Scientist | `analytics` |
| Cybersecurity Analyst | `shield` |
| Cloud Engineer | `cloud` |
| DevOps Specialist | `settings` |
| AI/ML Engineer | `psychology` |
| UI/UX Designer | `design-services` |
| Full Stack Engineer | `layers` |
| Mobile App Developer | `smartphone` |
| IT Systems Architect | `account-tree` |

---

## How It All Connects (Mobile App Flow)

1. **Top 10 In-Demand Roles** (`global-skill-shortages` screen) — fetches from `in_demand_roles` table
2. **Job Feed** (`jobs-feed` screen) — fetches from `jobs` table with filters:
   - "All Jobs" tab — no filter
   - "Remote Only" tab — `job_type = 'Remote'`
   - "Sponsorship" tab — `visa_sponsorship = 'YES'`
   - Search bar — searches title, company, description
3. **Job Detail** (`job-detail` screen) — fetches single job by ID, shows all fields including `requirements` JSONB
4. **Confirm Job & CV** (`confirm-job-cv` screen) — receives job title/company/description from previous screen
5. **Saved Jobs** — users can bookmark jobs (stored in `saved_jobs` table, linked to their auth profile)

---

## Quick Test Checklist

After running the SQL and deploying:

- [ ] Verify `in_demand_roles` table has 10 seeded rows in Supabase Table Editor
- [ ] POST a test job via the admin API and confirm it appears in the `jobs` table
- [ ] Open the mobile app → Browse Jobs → verify the Top 10 roles load from DB
- [ ] Tap "Continue" → verify the Job Feed shows the test job
- [ ] Use search and filter tabs to verify they work
- [ ] Tap a job → verify the detail screen shows real data
- [ ] Tap bookmark → verify a row appears in `saved_jobs`
- [ ] Tap "Check My Fit" → verify the confirm screen shows the correct job title and company

---

## Notes

- The `generate-summary` edge function also needs deployment (requires `npx supabase login` — CLI session expired)
- CV upload functionality on the Confirm Job & CV screen is not yet wired — that's the next phase
- Featured jobs (`is_featured = true`) always appear first in the feed
- Jobs are sorted by: featured first, then by posted date (newest first)
