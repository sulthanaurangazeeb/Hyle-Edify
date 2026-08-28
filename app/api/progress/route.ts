import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COMPLETION_THRESHOLD = 0.9; // ≥90% of the video counts as completed
const MAX_DELTA_SECONDS = 15;
const MAX_POSITION_SECONDS = 2_147_483_647; // PostgreSQL/Prisma Int upper bound

const bodySchema = z.object({
  videoId: z.string().uuid(),
  positionSeconds: z.number().finite().min(0),
  deltaSeconds: z.number().finite().min(0).default(0), // watch time since last beat; capped server-side below
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
  const { videoId } = parsed.data;
  const position = Math.min(MAX_POSITION_SECONDS, Math.max(0, Math.floor(parsed.data.positionSeconds)));
  const deltaSeconds = Math.min(MAX_DELTA_SECONDS, Math.max(0, Math.floor(parsed.data.deltaSeconds)));

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
      ? Math.min(position, video.durationSeconds)
      : position;
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
  const parsedVideoId = z.string().uuid().safeParse(videoId);
  if (!parsedVideoId.success) {
    return NextResponse.json({ error: "Invalid videoId" }, { status: 400 });
  }

  const progress = await prisma.videoProgress.findUnique({
    where: { userId_videoId: { userId: user.id, videoId: parsedVideoId.data } },
  });

  return NextResponse.json({
    lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
    completed: progress?.completed ?? false,
  });
}
