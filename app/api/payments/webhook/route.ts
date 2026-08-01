import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { capturePaymentAndEnroll, markPaymentFailed } from "@/lib/payments";

/**
 * Razorpay webhook — the source of truth for payment state.
 * Configure in Razorpay Dashboard → Webhooks with events:
 * payment.captured, payment.failed. Secret goes in RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventId = request.headers.get("x-razorpay-event-id") ?? "";

  // Idempotency: record the event id; a duplicate delivery hits the unique
  // constraint and is acknowledged without re-processing.
  if (eventId) {
    try {
      await prisma.webhookEvent.create({
        data: { eventId, eventType: event.event, payload: event },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      throw e;
    }
  }

  const paymentEntity = event.payload?.payment?.entity;

  switch (event.event) {
    case "payment.captured":
      if (paymentEntity?.order_id && paymentEntity?.id) {
        await capturePaymentAndEnroll(paymentEntity.order_id, paymentEntity.id);
      }
      break;
    case "payment.failed":
      if (paymentEntity?.order_id) {
        await markPaymentFailed(
          paymentEntity.order_id,
          paymentEntity.error_description ?? undefined
        );
      }
      break;
    default:
      break; // acknowledge unhandled events
  }

  return NextResponse.json({ ok: true });
}
