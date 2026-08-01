import Image from "next/image";
import Link from "next/link";
import { MonitorPlay, Radio, TrendingUp, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";

export const revalidate = 300;

const features = [
  {
    icon: MonitorPlay,
    title: "Recorded classes",
    text: "Structured video lessons you can rewatch anytime, at your own pace.",
  },
  {
    icon: Radio,
    title: "Live classes",
    text: "Interactive sessions on Zoom/Google Meet with your teachers.",
  },
  {
    icon: TrendingUp,
    title: "Progress tracking",
    text: "Pick up exactly where you left off — we track every second you learn.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    text: "UPI, cards & netbanking via Razorpay. Instant course access.",
  },
];

export default async function LandingPage() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <Image
            src="/brand/logo-mark.png"
            alt="Hyle Edify logo"
            width={112}
            height={112}
            priority
            className="h-24 w-24 drop-shadow-sm sm:h-28 sm:w-28"
          />
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-hyle-navy sm:text-5xl">
            Where <span className="text-hyle-green">Matter</span> Becomes{" "}
            <span className="text-hyle-green">Mastery</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Foundation courses for NEET & JEE aspirants and rock-solid basics in
            Mathematics — with recorded lessons, live classes and personal
            progress tracking.
          </p>
          <div className="flex gap-3">
            <Link href="/#courses">
              <Button size="lg" variant="accent" className="font-semibold">
                Explore courses
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Create free account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border p-6">
            <f.icon className="mb-3 h-8 w-8 text-hyle-green" />
            <h3 className="mb-1 font-semibold text-hyle-navy">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      {/* Courses */}
      <section id="courses" className="bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-2 text-center text-3xl font-bold text-hyle-navy">
            Our Courses
          </h2>
          <p className="mb-10 text-center text-muted-foreground">
            Start your journey from matter to mastery.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
