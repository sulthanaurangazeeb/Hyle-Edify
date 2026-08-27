-- Hyle Edify: production-safe baseline RLS
--
-- Prisma runs through the privileged PostgreSQL connection. These policies
-- govern Supabase anon/authenticated client roles and do not use FORCE RLS.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read only their own profile. There is deliberately
-- no INSERT, UPDATE, or DELETE policy, so role escalation is not possible via
-- Supabase client roles.
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Authenticated users may read only their own enrollment rows. Enrollment
-- creation and status changes remain backend/payment operations through Prisma.
CREATE POLICY enrollments_select_own
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = "userId");

-- Prisma migration metadata is internal and must not be reachable by client
-- roles, even if table privileges are granted by the database defaults.
REVOKE ALL ON TABLE public._prisma_migrations FROM anon, authenticated;
