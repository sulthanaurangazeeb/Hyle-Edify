import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@prisma/client";

/**
 * Returns the app-level user profile for the current Supabase session,
 * creating the profile row on first authenticated request.
 * Cached per-request so layouts + pages share one lookup.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.user.upsert({
    where: { id: user.id },
    update: {}, // profile exists — leave as-is
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@unknown.local`,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    },
  });
});

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** ADMIN or TEACHER only — students are bounced to their dashboard. */
export async function requireStaff(): Promise<User> {
  const user = await requireUser();
  if (user.role === "STUDENT") redirect("/dashboard");
  return user;
}

/** ADMIN-only access — students and teachers are bounced to their dashboard. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function isEnrolled(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return enrollment?.status === "ACTIVE";
}
