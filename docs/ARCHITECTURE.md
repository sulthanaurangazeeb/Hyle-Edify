# Hyle Edify — Architecture & Initialization Plan

> **Where Matter Becomes Mastery**

Educational platform MVP: recorded classes, live classes, per-second video progress
tracking, and Razorpay (INR) fee payment.

---

## 1. Tech Stack

| Layer      | Choice                                          | Why |
|------------|--------------------------------------------------|-----|
| Frontend   | Next.js 15 (App Router) + TypeScript             | SSR for landing/SEO, server components for dashboards |
| UI         | Tailwind CSS v4 + shadcn/ui                      | Fast, consistent, themeable with brand tokens |
| Database   | PostgreSQL (Supabase-hosted)                     | Managed, free tier fits MVP |
| ORM        | Prisma                                           | Type-safe queries, migrations, portable schema |
| Auth       | Supabase Auth (email + password / OTP)           | RBAC via `User.role` mirrored in our DB |
| Storage    | Supabase Storage                                 | Thumbnails, PDFs/notes |
| Video      | Provider-agnostic (`YOUTUBE` unlisted / `VIMEO` / `MUX`) | Start free with unlisted YouTube, upgrade to Mux for signed playback |
| Live class | Zoom / Google Meet join links (embed page)       | No SDK cost at MVP stage |
| Payments   | Razorpay Orders API + Webhooks                   | INR-native, UPI/cards/netbanking |

## 2. Directory Structure

```
hyle-app/
├── app/
│   ├── (marketing)/              # Public pages
│   │   ├── page.tsx              # Landing — hero, motto, course catalog
│   │   └── courses/[slug]/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (student)/                # Auth-gated, role=STUDENT
│   │   ├── dashboard/page.tsx    # Enrolled courses, progress bars, upcoming live
│   │   ├── learn/[courseSlug]/page.tsx           # Course player shell
│   │   └── learn/[courseSlug]/[lessonId]/page.tsx # Video player + playlist
│   ├── (admin)/                  # Auth-gated, role=ADMIN|TEACHER
│   │   └── admin/
│   │       ├── page.tsx          # Overview: revenue, enrollments
│   │       ├── courses/...       # CRUD courses/modules/lessons/videos
│   │       ├── live/...          # Schedule live sessions
│   │       └── students/...      # Enrollment + progress views
│   ├── api/
│   │   ├── payments/
│   │   │   ├── create-order/route.ts   # POST → Razorpay order
│   │   │   ├── verify/route.ts         # POST → HMAC verify, enroll
│   │   │   └── webhook/route.ts        # POST → Razorpay webhook (idempotent)
│   │   └── progress/route.ts           # POST heartbeat / GET resume position
│   ├── layout.tsx
│   └── globals.css               # Brand theme tokens
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── video-player.tsx          # Provider-agnostic player w/ progress heartbeat
│   ├── course-card.tsx, progress-bar.tsx, live-session-card.tsx, ...
├── lib/
│   ├── prisma.ts                 # Prisma singleton
│   ├── supabase/                 # server + browser clients
│   ├── auth.ts                   # getSessionUser(), requireRole()
│   ├── razorpay.ts               # Razorpay client + signature utils
│   └── utils.ts                  # cn() etc.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # Initial course catalog
├── public/brand/                 # Logos (svg/png)
├── middleware.ts                 # Session refresh + route guards
└── .env.example
```

## 3. Data Model (summary)

- **User** — mirrors Supabase `auth.users` id; `role` = STUDENT | TEACHER | ADMIN.
- **Course → Module → Lesson** — hierarchy; lessons are RECORDED (has `Video`) or LIVE (has `LiveSession`).
- **Video** — provider + provider video id + `durationSeconds`.
- **VideoProgress** — one row per (user, video): `lastPositionSeconds` (resume point),
  `maxPositionSeconds` (furthest reached), `watchedSeconds` (cumulative watch time),
  `completed` flag. Updated by a 10–15 s heartbeat from the player. Progress %
  = `maxPositionSeconds / durationSeconds`.
- **Enrollment** — unique (user, course); created only after verified payment. Gates all content access.
- **Payment** — Razorpay order lifecycle (CREATED → CAPTURED/FAILED), amounts in **paise**.
- **WebhookEvent** — stores processed Razorpay event ids for idempotency.

## 4. Payment Flow (Razorpay)

1. Student clicks *Enroll* → `POST /api/payments/create-order` (server creates Razorpay
   order for the course price in paise, stores `Payment` row as CREATED).
2. Razorpay Checkout opens on the client with the order id.
3. On success, client calls `POST /api/payments/verify` → server recomputes
   `HMAC_SHA256(order_id|payment_id, key_secret)` and compares signatures →
   marks Payment CAPTURED → creates Enrollment.
4. `POST /api/payments/webhook` (signature-verified, idempotent via `WebhookEvent`)
   is the source of truth for `payment.captured` / `payment.failed` — covers cases
   where the user closes the tab before step 3.

## 5. Progress Tracking Flow

- Player component emits a heartbeat every ~10 s and on pause/seek/unload:
  `{ videoId, positionSeconds, deltaWatchedSeconds }`.
- `POST /api/progress` upserts VideoProgress: advances `maxPositionSeconds`,
  accumulates `watchedSeconds`, sets `completed` when ≥ 90% of duration.
- On player mount, `GET /api/progress?videoId=` returns `lastPositionSeconds` to resume.

## 6. Course Catalog (seed data)

| Course | Price |
|---|---|
| Basic Maths Course | ₹6,000 |
| Class 6 Foundation (NEET/JEE) | ₹12,000 |
| Class 7 Foundation (NEET/JEE) | ₹14,000 |
| Class 8 Foundation (NEET/JEE) | ₹16,000 |

## 7. Brand Tokens

From the official logo SVG:
- Primary green: `#72BF44` (accents, CTAs, progress bars)
- Deep navy: `#07456B` (headings, nav, footer)
- Motto: **"Where Matter Becomes Mastery"** — landing hero + dashboard greeting.

## 8. Build Order

1. ✅ Scaffold + configs + Prisma schema + seed (this step)
2. Auth (Supabase) + middleware route guards + role helpers
3. API routes: payments (create-order / verify / webhook), progress
4. Marketing pages (landing + course detail) with branding
5. Student dashboard + course player (video + live)
6. Admin panel (course CRUD, live scheduling, student progress)
7. Deploy: Vercel + Supabase + Razorpay live keys
