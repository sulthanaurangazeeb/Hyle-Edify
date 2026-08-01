import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COMPLETION_THRESHOLD = 0.9; // ≥90% of the video counts as completed

const bodySchema = z.object({
  videoId: z.string().uuid(),
  positionSeconds: z.number().int().min(0),
  deltaSeconds: z.number().int().min(0).max(120).default(0), // watch time since last beat
});

/** Player heartbeat — upserts per-second progress for the current user. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { videoId, positionSeconds, deltaSeconds } = parsed.data;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      lesson: {
        include: { module: { select: { courseId: true } } },
      },
    },
  });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Access: enrolled in the course, free preview, or staff.
  if (user.role === "STUDENT" && !video.lesson.isFreePreview) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: video.lesson.module.courseId,
        },
      },
    });
    if (enrollment?.status !== "ACTIVE") {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }
  }

  const existing = await prisma.videoProgress.findUnique({
    where: { userId_videoId: { userId: user.id, videoId } },
  });

  const clampedPosition =
    video.durationSeconds > 0
      ? Math.min(positionSeconds, video.durationSeconds)
      : positionSeconds;
  const maxPosition = Math.max(existing?.maxPositionSeconds ?? 0, clampedPosition);
  const completed =
    (existing?.completed ?? false) ||
    (video.durationSeconds > 0 &&
      maxPosition >= video.durationSeconds * COMPLETION_THRESHOLD);

  const progress = await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId: user.id, videoId } },
    create: {
      userId: user.id,
      videoId,
      lastPositionSeconds: clampedPosition,
      maxPositionSeconds: maxPosition,
      watchedSeconds: deltaSeconds,
      completed,
    },
    update: {
      lastPositionSeconds: clampedPosition,
      maxPositionSeconds: maxPosition,
      watchedSeconds: { increment: deltaSeconds },
      completed,
    },
  });

  return NextResponse.json({
    ok: true,
    completed: progress.completed,
    maxPositionSeconds: progress.maxPositionSeconds,
  });
}

/** Resume point for a video: /api/progress?videoId=... */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const videoId = new URL(request.url).searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const progress = await prisma.videoProgress.findUnique({
    where: { userId_videoId: { userId: user.id, videoId } },
  });

  return NextResponse.json({
    lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
    completed: progress?.completed ?? false,
  });
}
