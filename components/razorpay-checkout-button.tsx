"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, cb: (resp: unknown) => void): void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface CheckoutButtonProps {
  courseId: string;
  priceLabel: string; // "₹6,000"
  isLoggedIn: boolean;
  courseSlug: string;
  isFree?: boolean;
}

export function RazorpayCheckoutButton({
  courseId,
  priceLabel,
  isLoggedIn,
  courseSlug,
  isFree = false,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);

    if (!isLoggedIn) {
      router.push(`/login?next=/courses/${courseSlug}`);
      return;
    }

    setBusy(true);
    try {
      if (isFree) {
        const enrollmentRes = await fetch("/api/enroll/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
        if (enrollmentRes.status === 401) {
          router.push(`/login?next=/courses/${courseSlug}`);
          return;
        }
        const enrollment = await enrollmentRes.json().catch(() => ({}));
        if (!enrollmentRes.ok) throw new Error(enrollment.error ?? "Could not complete enrollment.");
        router.push(`/learn/${enrollment.courseSlug ?? courseSlug}?enrolled=1`);
        router.refresh();
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load the payment gateway. Check your connection.");
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (orderRes.status === 409) {
        router.push("/dashboard");
        return;
      }
      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not start checkout.");
      }
      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Hyle Edify",
        description: order.courseTitle,
        image: "/brand/logo.svg",
        order_id: order.orderId,
        prefill: { email: order.userEmail, name: order.userName },
        theme: { color: "#07456B" },
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (verifyRes.ok) {
            router.push("/dashboard?enrolled=1");
            router.refresh();
          } else {
            setError(
              "Payment received but verification is pending. If access doesn't unlock in a few minutes, contact support."
            );
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        variant="accent"
        className="w-full font-semibold"
        onClick={handleClick}
        disabled={busy}
      >
        {busy ? "Opening checkout…" : `Enroll now · ${priceLabel}`}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
