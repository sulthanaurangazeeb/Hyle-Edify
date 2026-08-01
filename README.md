# Hyle Edify

> **Where Matter Becomes Mastery**

Educational platform MVP — recorded classes, live classes, per-second progress
tracking, and Razorpay payments. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
for the full design.

## Prerequisites

- **Node.js 20+** — https://nodejs.org (`winget install OpenJS.NodeJS.LTS`)
- A **Supabase** project (free tier): https://supabase.com
- A **Razorpay** account (test mode is fine): https://razorpay.com

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
copy .env.example .env
#    Fill in Supabase DB URLs + API keys and Razorpay keys (see comments inside)

# 3. Create the database schema
npx prisma migrate dev --name init

# 4. Seed the course catalog (4 courses)
npm run db:seed

# 5. Run
npm run dev        # http://localhost:3000
```

## One-time configuration

### Supabase
- **Auth → Providers → Email**: enabled by default. For instant signup during
  development you can disable "Confirm email".
- **Auth → URL Configuration**: add `http://localhost:3000/auth/callback`
  (and your production URL later) to Redirect URLs.

### Make yourself admin
Register through the app once, then run in Supabase SQL editor (or `npx prisma studio`):

```sql
update users set role = 'ADMIN' where email = 'you@example.com';
```

`ADMIN`/`TEACHER` accounts see the **Admin** panel at `/admin`.

### Razorpay webhook
Dashboard → Settings → Webhooks → Add:
- URL: `https://<your-domain>/api/payments/webhook` (use ngrok for local testing)
- Events: `payment.captured`, `payment.failed`
- Put the webhook secret in `RAZORPAY_WEBHOOK_SECRET`.

### Adding content (admin panel)
1. `/admin/courses` — courses are pre-seeded; open one to add **modules** and **lessons**.
2. For recorded lessons paste the **YouTube video ID** (the `v=` part of an
   unlisted video's URL) and its duration in seconds.
3. `/admin/live` — schedule live classes with a Zoom/Meet link; enrolled
   students see them on their dashboard.

## How progress tracking works

The player sends a heartbeat every 10 seconds (and on pause/tab close) to
`POST /api/progress` with the current position and seconds actually watched.
The `video_progress` table keeps, per student per video: the resume point,
the furthest position reached, cumulative watch time, and a completed flag
(≥90% watched). Dashboards aggregate these into course progress bars.
