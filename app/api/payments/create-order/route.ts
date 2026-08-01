import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

const bodySchema = z.object({ courseId: z.string().uuid() });

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
  });
  if (!course || !course.isPublished) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  });
  if (existing?.status === "ACTIVE") {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  const order = await razorpay.orders.create({
    amount: course.priceInPaise,
    currency: "INR",
    receipt: `crs_${course.slug.slice(0, 30)}`,
    notes: { userId: user.id, courseId: course.id },
  });

  await prisma.payment.create({
    data: {
      userId: user.id,
      courseId: course.id,
      razorpayOrderId: order.id,
      amountInPaise: course.priceInPaise,
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: course.priceInPaise,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    courseTitle: course.title,
    userEmail: user.email,
    userName: user.fullName ?? "",
  });
}
