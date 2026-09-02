import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, Circle, MonitorPlay, PlayCircle, Radio } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, isEnrolled } from "@/lib/auth";
import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "@/components/video-player";
import { MarkLessonComplete } from "@/components/mark-lesson-complete";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: {
              video: true,
              liveSession: true,
            },
          },
        },
      },
    },
  });
  if (!course) notFound();

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const lesson = allLessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const enrolled =
    user.role !== "STUDENT" || (await isEnrolled(user.id, course.id));
  if (!enrolled && !lesson.isFreePreview) {
    redirect(`/courses/${course.slug}`);
  }

  // Progress for the sidebar checkmarks + resume position for this lesson.
  const videoIds = allLessons.flatMap((l) => (l.video ? [l.video.id] : []));
  const progressRows = await prisma.videoProgress.findMany({
    where: { userId: user.id, videoId: { in: videoIds } },
  });
  const progressByVideo = new Map(progressRows.map((p) => [p.videoId, p]));
  const currentProgress = lesson.video
    ? progressByVideo.get(lesson.video.id)
    : undefined;
  const completedLessons = allLessons.filter((item) => item.video && progressByVideo.get(item.video.id)?.completed).length;
  const progressPercent = allLessons.length > 0 ? Math.round((completedLessons / allLessons.length) * 100) : 0;

  const idx = allLessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? allLessons[idx - 1] : null;
  const next = idx < allLessons.length - 1 ? allLessons[idx + 1] : null;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px]">
      {/* Player column */}
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>{" "}/{" "}
          <Link href={`/learn/${course.slug}`} className="hover:underline">{course.title}</Link>{" "}/ {lesson.title}
        </div>

        {lesson.type === "RECORDED" && lesson.video ? (
          <VideoPlayer
            videoId={lesson.video.id}
            youtubeId={lesson.video.providerVideoId}
            initialPositionSeconds={currentProgress?.lastPositionSeconds ?? 0}
          />
        ) : lesson.type === "LIVE" && lesson.liveSession ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <Radio className="h-10 w-10 text-hyle-green" />
              <div>
                <p className="text-lg font-semibold text-hyle-navy">
                  Live class:{" "}
                  {format(
                    new Date(lesson.liveSession.scheduledAt),
                    "EEE, d MMM yyyy · h:mm a"
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lesson.liveSession.durationMinutes} minutes ·{" "}
                  {lesson.liveSession.provider === "ZOOM" ? "Zoom" : "Google Meet"}
                </p>
              </div>
              <a
                href={lesson.liveSession.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="accent" size="lg" className="font-semibold">
                  Join live class
                </Button>
              </a>
              {lesson.liveSession.recordingUrl && (
                <a
                  href={lesson.liveSession.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-hyle-green hover:underline"
                >
                  Watch recording
                </a>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Content for this lesson is being prepared.
            </CardContent>
          </Card>
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-hyle-navy">{lesson.title}</h1>
            {lesson.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {lesson.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {prev && (
              <Link href={`/learn/${course.slug}/${prev.id}`}>
                <Button variant="outline" size="sm">
                  ← Previous
                </Button>
              </Link>
            )}
            {next && (
              <Link href={`/learn/${course.slug}/${next.id}`}>
                <Button variant="accent" size="sm" className="font-semibold">
                  Next →
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-hyle-navy">Course progress</p>
            <p className="text-xs text-muted-foreground">{completedLessons} of {allLessons.length} lessons completed · {progressPercent}%</p>
          </div>
          {lesson.video && <MarkLessonComplete lessonId={lesson.id} courseSlug={course.slug} completed={currentProgress?.completed ?? false} />}
        </div>
      </div>

      {/* Playlist column */}
      <aside className="lg:border-l lg:pl-6">
        <h2 className="mb-4 font-semibold text-hyle-navy">Course content</h2>
        <div className="space-y-5">
          {course.modules.length === 0 && <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No lessons have been published for this course yet.</p>}
          {course.modules.map((mod, mi) => (
            <div key={mod.id}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Module {mi + 1} · {mod.title}
              </p>
              <ul className="space-y-1">
                {mod.lessons.map((l) => {
                  const p = l.video ? progressByVideo.get(l.video.id) : null;
                  const isCurrent = l.id === lesson.id;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${course.slug}/${l.id}`}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
                          isCurrent && "bg-secondary font-medium"
                        )}
                      >
                        {p?.completed ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-hyle-green" />
                        ) : isCurrent ? (
                          <PlayCircle className="h-4 w-4 shrink-0 text-hyle-navy" />
                        ) : l.type === "LIVE" ? (
                          <Radio className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1 truncate">{l.title}</span>
                        {l.video && l.video.durationSeconds > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(l.video.durationSeconds)}
                          </span>
                        )}
                        {!l.video && l.type === "RECORDED" && (
                          <MonitorPlay className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
