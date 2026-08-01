import { notFound } from "next/navigation";
import { CheckCircle2, MonitorPlay, Radio } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isEnrolled } from "@/lib/auth";
import { formatInr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RazorpayCheckoutButton } from "@/components/razorpay-checkout-button";
import Link from "next/link";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true, type: true, isFreePreview: true },
          },
        },
      },
    },
  });
  if (!course || !course.isPublished) notFound();

  const user = await getSessionUser();
  const enrolled = user ? await isEnrolled(user.id, course.id) : false;
  const lessonCount = course.modules.reduce(
    (n, m) => n + m.lessons.length,
    0
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_360px]">
      {/* Left: details + syllabus */}
      <div>
        <h1 className="text-3xl font-bold text-hyle-navy">{course.title}</h1>
        {course.subtitle && (
          <p className="mt-2 text-lg text-muted-foreground">{course.subtitle}</p>
        )}
        {course.description && (
          <p className="mt-4 whitespace-pre-line text-muted-foreground">
            {course.description}
          </p>
        )}

        <h2 className="mb-4 mt-10 text-xl font-semibold text-hyle-navy">
          Syllabus{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({course.modules.length} modules · {lessonCount} lessons)
          </span>
        </h2>

        {course.modules.length === 0 && (
          <p className="text-muted-foreground">Syllabus coming soon.</p>
        )}

        <div className="space-y-4">
          {course.modules.map((mod, i) => (
            <Card key={mod.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Module {i + 1}: {mod.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mod.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {lesson.type === "LIVE" ? (
                        <Radio className="h-4 w-4 shrink-0 text-hyle-green" />
                      ) : (
                        <MonitorPlay className="h-4 w-4 shrink-0 text-hyle-green" />
                      )}
                      <span>{lesson.title}</span>
                      {lesson.isFreePreview && (
                        <Badge variant="secondary">Free preview</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right: purchase card */}
      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="text-3xl text-hyle-navy">
              {formatInr(course.priceInPaise)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrolled ? (
              <Link href={`/learn/${course.slug}`} className="block">
                <Button size="lg" variant="accent" className="w-full font-semibold">
                  Continue learning
                </Button>
              </Link>
            ) : (
              <RazorpayCheckoutButton
                courseId={course.id}
                courseSlug={course.slug}
                priceLabel={formatInr(course.priceInPaise)}
                isLoggedIn={!!user}
              />
            )}
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Full access to all recorded lessons",
                "Live classes with teachers",
                "Progress tracking & resume anywhere",
                "Secure payment via Razorpay (UPI/cards)",
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-hyle-green" />
                  {line}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
