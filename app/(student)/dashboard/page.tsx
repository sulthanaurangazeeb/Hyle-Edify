import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LiveSessionCard } from "@/components/live-session-card";
import Image from "next/image";

function safeImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith("supabase.co") ? url : null;
  } catch { return null; }
}

export default async function DashboardPage() {
  const user = await requireUser();

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: { include: { video: { select: { id: true } } } },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const completedVideoIds = new Set(
    (
      await prisma.videoProgress.findMany({
        where: { userId: user.id, completed: true },
        select: { videoId: true },
      })
    ).map((p) => p.videoId)
  );

  const courseIds = enrollments.map((e) => e.courseId);
  const upcomingLive = await prisma.liveSession.findMany({
    where: {
      courseId: { in: courseIds },
      scheduledAt: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    },
    include: { course: { select: { title: true } } },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-hyle-navy">
          Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-muted-foreground">
          Where Matter Becomes Mastery — keep going.
        </p>
      </div>

      {upcomingLive.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-hyle-navy">
            Upcoming live classes
          </h2>
          <div className="space-y-3">
            {upcomingLive.map((s) => (
              <LiveSessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-hyle-navy">My courses</h2>
        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-muted-foreground">
                You haven&apos;t enrolled in any course yet.
              </p>
              <Link href="/courses">
                <Button variant="accent" className="font-semibold">
                  Browse courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map(({ course }) => {
              const videoIds = course.modules.flatMap((m) =>
                m.lessons.flatMap((l) => (l.video ? [l.video.id] : []))
              );
              const done = videoIds.filter((id) =>
                completedVideoIds.has(id)
              ).length;
              const pct =
                videoIds.length > 0
                  ? Math.round((done / videoIds.length) * 100)
                  : 0;

              return (
                <Card key={course.id} className="flex flex-col">
                  {safeImageUrl(course.thumbnailUrl) && <Image src={safeImageUrl(course.thumbnailUrl)!} alt={`${course.title} thumbnail`} width={640} height={360} className="aspect-video w-full rounded-t-lg object-cover" />}
                  <CardHeader>
                    <CardTitle className="text-base text-hyle-navy">
                      {course.title}
                    </CardTitle>
                    <CardDescription>
                      {done} of {videoIds.length} lessons completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Progress value={pct} />
                    <p className="mt-2 text-right text-sm font-medium text-hyle-green">
                      {pct}%
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/learn/${course.slug}`} className="w-full">
                      <Button className="w-full">
                        {pct > 0 ? "Continue learning" : "Start course"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
