"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isEnrolled, requireUser } from "@/lib/auth";

const COMPLETION_THRESHOLD = 0.9;

export type ProgressActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

/** Mark a lesson complete only after server-stored video progress reaches 90%. */
export async function markLessonComplete(
  lessonId: string,
  courseSlug: string
): Promise<ProgressActionResult> {
  const user = await requireUser();

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        isFreePreview: true,
        video: { select: { id: true, durationSeconds: true } },
        module: { select: { course: { select: { id: true, slug: true } } } },
      },
    });

    if (!lesson || lesson.module.course.slug !== courseSlug) {
      return { ok: false, error: "Lesson not found." };
    }

    if (user.role === "STUDENT" && !lesson.isFreePreview) {
      const enrolled = await isEnrolled(user.id, lesson.module.course.id);
      if (!enrolled) return { ok: false, error: "You are not enrolled in this course." };
    }

    if (!lesson.video || lesson.video.durationSeconds <= 0) {
      return { ok: false, error: "This lesson has no trackable video yet." };
    }

    const progress = await prisma.videoProgress.findUnique({
      where: { userId_videoId: { userId: user.id, videoId: lesson.video.id } },
      select: { maxPositionSeconds: true, completed: true },
    });
    const threshold = lesson.video.durationSeconds * COMPLETION_THRESHOLD;
    if (!progress?.completed && (progress?.maxPositionSeconds ?? 0) < threshold) {
      return { ok: false, error: "Watch at least 90% of the video before completing this lesson." };
    }

    await prisma.videoProgress.update({
      where: { userId_videoId: { userId: user.id, videoId: lesson.video.id } },
      data: { completed: true },
    });
    revalidatePath(`/learn/${courseSlug}/${lessonId}`);
    revalidatePath("/dashboard");
    return { ok: true, message: "Lesson marked complete." };
  } catch {
    return { ok: false, error: "Unable to update lesson progress. Please try again." };
  }
}
