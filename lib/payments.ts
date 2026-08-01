import { prisma } from "@/lib/prisma";

/**
 * Marks a payment CAPTURED and creates the enrollment.
 * Called from both /api/payments/verify (happy path) and the Razorpay
 * webhook (source of truth). Idempotent — safe to run twice.
 */
export async function capturePaymentAndEnroll(
  razorpayOrderId: string,
  razorpayPaymentId: string
) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { razorpayOrderId },
    });
    if (!payment) throw new Error(`No payment for order ${razorpayOrderId}`);

    if (payment.status !== "CAPTURED") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "CAPTURED", razorpayPaymentId },
      });
    }

    await tx.enrollment.upsert({
      where: {
        userId_courseId: { userId: payment.userId, courseId: payment.courseId },
      },
      update: { status: "ACTIVE" },
      create: {
        userId: payment.userId,
        courseId: payment.courseId,
        paymentId: payment.id,
      },
    });

    return payment;
  });
}

export async function markPaymentFailed(
  razorpayOrderId: string,
  reason?: string
) {
  await prisma.payment.updateMany({
    where: { razorpayOrderId, status: "CREATED" },
    data: { status: "FAILED", failureReason: reason ?? "payment.failed" },
  });
}
