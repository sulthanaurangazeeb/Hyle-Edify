import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, isEnrolled } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Entry point for a course: jump to the last-watched or first lesson. */
export default async function CourseEntryPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: { video: { select: { id: true } } },
          },
        },
      },
    },
  });
  if (!course) notFound();

  if (user.role === "STUDENT" && !(await isEnrolled(user.id, course.id))) {
    redirect(`/courses/${course.slug}`);
  }

  const lessons = course.modules.flatMap((m) => m.lessons);
  if (lessons.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <h1 className="text-2xl font-bold text-hyle-navy">{course.title}</h1>
            <p className="text-sm text-muted-foreground">No lessons have been published for this course yet.</p>
            <Link href="/dashboard"><Button variant="outline">Back to dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Resume where the student left off: most recently watched video in course.
  const videoIds = lessons.flatMap((l) => (l.video ? [l.video.id] : []));
  const lastProgress = await prisma.videoProgress.findFirst({
    where: { userId: user.id, videoId: { in: videoIds } },
    orderBy: { lastWatchedAt: "desc" },
  });

  const target = lastProgress
    ? lessons.find((l) => l.video?.id === lastProgress.videoId) ?? lessons[0]
    : lessons[0];

  redirect(`/learn/${course.slug}/${target.id}`);
}
