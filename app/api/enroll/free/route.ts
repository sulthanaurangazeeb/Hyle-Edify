import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ courseId: z.string().uuid() });

/** Enrolls the authenticated user in a published zero-price course. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in to enroll." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid course." }, { status: 400 });

  try {
    const course = await prisma.course.findUnique({
      where: { id: parsed.data.courseId },
      select: { id: true, slug: true, priceInPaise: true, isPublished: true },
    });
    if (!course || !course.isPublished) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }
    if (course.priceInPaise !== 0) {
      return NextResponse.json({ error: "This course requires payment." }, { status: 400 });
    }

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: { status: "ACTIVE" },
      create: { userId: user.id, courseId: course.id, status: "ACTIVE" },
    });

    return NextResponse.json({ ok: true, courseSlug: course.slug });
  } catch {
    return NextResponse.json({ error: "Could not complete enrollment. Please try again." }, { status: 500 });
  }
}

