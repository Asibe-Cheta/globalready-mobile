# Course data for the mobile app

This file is for the mobile team. It explains where course data comes from and how it stays in sync with the admin website.

## Source of truth

- **Same Supabase table:** Both the mobile app and the admin dashboard read/write the same `courses` table in Supabase. Any course the admin creates or edits is immediately visible to the mobile app.

- **Admin website** writes courses via the Admin API edge function (`admin-api/courses`) using a service role key through a Next.js proxy.

- **Mobile app** reads courses directly from Supabase using the anon key + RLS. This is the correct approach for a client-side app.

## Why the mobile app does NOT use the Admin API to read courses

The Admin API requires a **service role key** (or `x-admin-key`). Embedding that key in a mobile app would be a **security risk** — service role keys bypass all Row Level Security and grant full database access. Instead:

- The mobile app uses the **Supabase client** with the **anon key**, which is safe for client-side use.
- The RLS policy `"Anyone can view active courses"` ensures the app can read all active courses.
- Both the Admin API and the Supabase client read from the **same `courses` table** — data is always in sync.

## How it works

```
Admin Dashboard (globalready.tech)
  └─ Next.js proxy (/api/admin/courses)
       └─ Admin API edge function (service role key)
            └─ Supabase `courses` table  ← same table
                                          ↑
Mobile App (Expo / React Native)          │
  └─ coursesService.getCourses()          │
       └─ Supabase client (anon key + RLS) ┘
```

## Summary

| What | Where |
|------|--------|
| **Admin writes** | Admin API: `POST/PUT/PATCH/DELETE /courses` (service role key, server-side only) |
| **Mobile reads** | Supabase client: `courses` table (anon key + RLS, client-safe) |
| **Admin UI** | Website admin dashboard → proxy → Admin API → same Supabase `courses` table |
| **Data sync** | Automatic — both sides use the same table |
| **Registrations** | Mobile writes to `course_registrations` via Supabase client; admin reads via Admin API `GET /registrations` |

## Mobile service location

- **Service:** `services/supabase/courses.ts`
  - `getCourses(filters?)` — fetches active courses, ordered by featured first
  - `getCourseById(id)` — fetches a single course
  - `registerForCourse(courseId, data)` — registers user and notifies admin via email

## Course fields available (after migration)

The `courses` table now includes all fields the admin can populate. See `ADMIN_API_DOCS.md` → "Course Fields Reference" for the full list. Key fields the mobile app uses:

- `title`, `subtitle`, `description`, `category`
- `thumbnail_url`, `image_url`
- `duration_hours`, `total_lessons`, `duration`
- `instructor`, `instructor_avatar`
- `price`, `currency`, `level`
- `syllabus` (JSON), `prerequisites`, `learning_outcomes`
- `tags`, `featured`, `is_active`
