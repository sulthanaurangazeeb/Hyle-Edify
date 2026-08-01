import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on everything except static assets and the Razorpay webhook
  // (webhooks carry no session and must not be redirected).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|api/payments/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
