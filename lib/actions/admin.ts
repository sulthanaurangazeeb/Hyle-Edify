"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LessonType, LiveProvider, VideoProvider } from "@prisma/client";

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

// ---------------------------------------------------------------- courses --

export async function saveCourse(formData: FormData) {
  await requireStaff();
  const id = str(formData, "id");
  const data = {
    title: str(formData, "title"),
    slug: str(formData, "slug")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    subtitle: str(formData, "subtitle") || null,
    description: str(formData, "description") || null,
    priceInPaise: Math.round(Number(str(formData, "priceRupees") || 0) * 100),
    isPublished: formData.get("isPublished") === "on",
  };
  if (!data.title || !data.slug || data.priceInPaise <= 0) {
    throw new Error("Title, slug and a positive price are required.");
  }

  if (id) {
    await prisma.course.update({ where: { id }, data });
  } else {
    await prisma.course.create({ data });
  }
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

// ---------------------------------------------------------------- modules --

export async function addModule(formData: FormData) {
  await requireStaff();
  const courseId = str(formData, "courseId");
  const title = str(formData, "title");
  if (!courseId || !title) throw new Error("Module title is required.");

  const count = await prisma.module.count({ where: { courseId } });
  await prisma.module.create({
    data: { courseId, title, sortOrder: count + 1 },
  });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteModule(formData: FormData) {
  await requireStaff();
  const id = str(formData, "id");
  const mod = await prisma.module.delete({ where: { id } });
  revalidatePath(`/admin/courses/${mod.courseId}`);
}

// ---------------------------------------------------------------- lessons --

export async function addLesson(formData: FormData) {
  await requireStaff();
  const moduleId = str(formData, "moduleId");
  const courseId = str(formData, "courseId");
  const title = str(formData, "title");
  const type = (str(formData, "type") || "RECORDED") as LessonType;
  if (!moduleId || !title) throw new Error("Lesson title is required.");

  const count = await prisma.lesson.count({ where: { moduleId } });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title,
      type,
      sortOrder: count + 1,
      isFreePreview: formData.get("isFreePreview") === "on",
    },
  });

  if (type === "RECORDED") {
    const providerVideoId = str(formData, "providerVideoId");
    if (providerVideoId) {
      await prisma.video.create({
        data: {
          lessonId: lesson.id,
          provider: (str(formData, "provider") || "YOUTUBE") as VideoProvider,
          providerVideoId,
          durationSeconds: Number(str(formData, "durationSeconds") || 0),
        },
      });
    }
  }
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteLesson(formData: FormData) {
  await requireStaff();
  const id = str(formData, "id");
  const courseId = str(formData, "courseId");
  await prisma.lesson.delete({ where: { id } });
  revalidatePath(`/admin/courses/${courseId}`);
}

// ----------------------------------------------------------- live classes --

export async function scheduleLiveSession(formData: FormData) {
  await requireStaff();
  const courseId = str(formData, "courseId");
  const title = str(formData, "title");
  const joinUrl = str(formData, "joinUrl");
  const scheduledAt = str(formData, "scheduledAt"); // datetime-local value
  if (!courseId || !title || !joinUrl || !scheduledAt) {
    throw new Error("Course, title, link and time are required.");
  }

  await prisma.liveSession.create({
    data: {
      courseId,
      title,
      provider: (str(formData, "provider") || "GOOGLE_MEET") as LiveProvider,
      joinUrl,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: Number(str(formData, "durationMinutes") || 60),
    },
  });
  revalidatePath("/admin/live");
  revalidatePath("/dashboard");
}

export async function deleteLiveSession(formData: FormData) {
  await requireStaff();
  const id = str(formData, "id");
  await prisma.liveSession.delete({ where: { id } });
  revalidatePath("/admin/live");
}
