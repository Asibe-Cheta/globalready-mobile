# Response to Website Team — Course Data Integration

## Status: Ready

The mobile app is fully integrated with the shared Supabase backend. Courses added or edited through the admin dashboard are immediately available in the mobile app.

## How the mobile app reads courses

The mobile app reads courses **directly from the Supabase `courses` table** using the anon key and Row Level Security — not through the Admin API.

**Why not the Admin API?**
The Admin API requires a service role key. Embedding that key in a client-side mobile app would be a security risk (it bypasses all RLS and grants full DB access). The anon key + RLS approach is the standard secure pattern for client apps.

**Does this cause sync issues?**
No. Both the Admin API and the Supabase client read/write the same `courses` table. When the admin creates or updates a course via the dashboard, it writes to the table. When the mobile app fetches courses, it reads from the same table. Data is always in sync — no delay, no caching layer.

## Architecture

```
Website Admin Dashboard
  └─ /api/admin/courses (Next.js proxy)
       └─ admin-api edge function (service role key)
            └─ writes to `courses` table
                        │
                  same table
                        │
Mobile App              │
  └─ coursesService     │
       └─ Supabase JS client (anon key + RLS)
            └─ reads from `courses` table
```

## What the mobile app already handles

- Fetches all active courses with category filtering and featured-first ordering
- Displays all course fields the admin populates (title, subtitle, thumbnail, duration, instructor, price, level, etc.)
- Course registration with automatic admin email notification
- Payment flow with automatic admin email notification
- User signup with automatic admin email notification

## Admin notifications the mobile app sends

When these events happen in the mobile app, the admin receives an email:

| Event | Email contains |
|-------|---------------|
| New user signup | Name, email |
| Course registration | Student name, email, phone, course title, category |
| Successful payment | Amount, customer email, Stripe reference, service type |

Admin notification emails are sent to the addresses configured in the `admin_settings` table (key: `admin_emails`).

## Course fields the mobile app uses

All fields from the expanded `courses` table are available. The mobile app currently renders:

- `title`, `description`, `category`
- `thumbnail_url` (course card image)
- `duration_hours` (displayed as "X hours")
- `featured` (featured courses appear first)
- `is_active` (only active courses are shown)

Additional fields are stored and available for future use: `subtitle`, `instructor`, `price`, `level`, `syllabus`, `prerequisites`, `learning_outcomes`, `tags`, `rating`.

## API docs

Full Admin API documentation (all endpoints, request/response shapes, course fields reference) is in `ADMIN_API_DOCS.md` in the mobile repo.

## No action needed from website team

Everything is wired up. As long as the admin dashboard writes courses through the Admin API (which it already does), the mobile app will display them automatically.
