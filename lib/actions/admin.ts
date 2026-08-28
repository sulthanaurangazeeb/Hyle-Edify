"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LessonType, LiveProvider, VideoProvider } from "@prisma/client";
import {
  courseInputSchema,
  idSchema,
  lessonInputSchema,
  moduleInputSchema,
  nullableText,
  validateRecordedVideo,
  videoInputSchema,
} from "@/lib/validation/course";

export type AdminActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function numberValue(formData: FormData, key: string): number {
  return Number(str(formData, key));
}

function numberOrZero(formData: FormData, key: string): number {
  const value = str(formData, key);
  return value === "" ? 0 : Number(value);
}

function resultError(error: unknown): AdminActionResult {
  if (error instanceof Error && error.message) return { ok: false, error: error.message };
  return { ok: false, error: "Unable to save these changes. Please try again." };
}

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function requireCourse(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw new Error("The selected course was not found.");
  return course;
}

async function requireModule(moduleId: string, courseId: string) {
  const module = await prisma.module.findFirst({ where: { id: moduleId, courseId }, select: { id: true, courseId: true } });
  if (!module) throw new Error("The module does not belong to this course.");
  return module;
}

async function requireLesson(lessonId: string, moduleId: string, courseId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, moduleId, module: { courseId } },
    select: { id: true, moduleId: true },
  });
  if (!lesson) throw new Error("The lesson does not belong to this module and course.");
  return lesson;
}

// ---------------------------------------------------------------- courses --

export async function saveCourse(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const rawSlug = str(formData, "slug")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const id = str(formData, "id") || undefined;
    const parsed = courseInputSchema.safeParse({
      title: str(formData, "title"),
      slug: rawSlug,
      subtitle: nullableText(str(formData, "subtitle")),
      description: nullableText(str(formData, "description")),
      priceRupees: numberValue(formData, "priceRupees"),
      thumbnailUrl: nullableText(str(formData, "thumbnailUrl")),
      isPublished: bool(formData, "isPublished"),
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid course details." };
    if (id && !idSchema.safeParse(id).success) return { ok: false, error: "Invalid course ID." };

    const data = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      subtitle: parsed.data.subtitle,
      description: parsed.data.description,
      priceInPaise: Math.round(parsed.data.priceRupees * 100),
      thumbnailUrl: parsed.data.thumbnailUrl,
      isPublished: parsed.data.isPublished,
    };
    if (id) await prisma.course.update({ where: { id }, data });
    else await prisma.course.create({ data });
    revalidatePath("/admin/courses");
    revalidatePath("/");
    return { ok: true, message: id ? "Course saved." : "Course created." };
  } catch (error) {
    if (isUniqueConstraint(error)) return { ok: false, error: "That course slug is already in use. Please choose another." };
    return resultError(error);
  }
}

// ---------------------------------------------------------------- modules --

export async function addModule(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const courseId = str(formData, "courseId");
    const parsed = moduleInputSchema.safeParse({ courseId, title: str(formData, "title"), sortOrder: numberOrZero(formData, "sortOrder") });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid module details." };
    await requireCourse(parsed.data.courseId);
    const count = await prisma.module.count({ where: { courseId: parsed.data.courseId } });
    await prisma.module.create({ data: { courseId: parsed.data.courseId, title: parsed.data.title, sortOrder: parsed.data.sortOrder || count + 1 } });
    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    return { ok: true, message: "Module added." };
  } catch (error) {
    return resultError(error);
  }
}

export async function editModule(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const parsed = moduleInputSchema.safeParse({ moduleId: str(formData, "moduleId"), courseId: str(formData, "courseId"), title: str(formData, "title"), sortOrder: numberOrZero(formData, "sortOrder") });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid module details." };
    await requireModule(parsed.data.moduleId!, parsed.data.courseId);
    await prisma.module.update({ where: { id: parsed.data.moduleId }, data: { title: parsed.data.title, sortOrder: parsed.data.sortOrder } });
    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    return { ok: true, message: "Module saved." };
  } catch (error) { return resultError(error); }
}

export async function deleteModule(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const id = str(formData, "id");
    const courseId = str(formData, "courseId");
    await requireModule(id, courseId);
    await prisma.module.delete({ where: { id } });
    revalidatePath(`/admin/courses/${courseId}`);
    return { ok: true, message: "Module deleted." };
  } catch (error) { return resultError(error); }
}

// ---------------------------------------------------------------- lessons --

export async function addLesson(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const provider = (str(formData, "provider") || "YOUTUBE") as VideoProvider;
    const type = (str(formData, "type") || "RECORDED") as LessonType;
    const providerVideoId = nullableText(str(formData, "providerVideoId"));
    const parsed = lessonInputSchema.safeParse({ lessonId: undefined, moduleId: str(formData, "moduleId"), courseId: str(formData, "courseId"), title: str(formData, "title"), description: nullableText(str(formData, "description")), type, durationSeconds: numberOrZero(formData, "durationSeconds"), provider, providerVideoId, isFreePreview: bool(formData, "isFreePreview") });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lesson details." };
    const videoError = parsed.data.type === "RECORDED" ? validateRecordedVideo(parsed.data.provider, parsed.data.providerVideoId) : null;
    if (videoError) return { ok: false, error: videoError };
    await requireModule(parsed.data.moduleId, parsed.data.courseId);
    await prisma.$transaction(async (tx) => {
      const count = await tx.lesson.count({ where: { moduleId: parsed.data.moduleId } });
      const lesson = await tx.lesson.create({ data: { moduleId: parsed.data.moduleId, title: parsed.data.title, description: parsed.data.description, type: parsed.data.type, sortOrder: count + 1, isFreePreview: parsed.data.isFreePreview } });
      if (parsed.data.type === "RECORDED") await tx.video.create({ data: { lessonId: lesson.id, provider: parsed.data.provider, providerVideoId: parsed.data.providerVideoId!, durationSeconds: parsed.data.durationSeconds } });
    });
    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    return { ok: true, message: "Lesson added." };
  } catch (error) { return resultError(error); }
}

export async function editLesson(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const provider = (str(formData, "provider") || "YOUTUBE") as VideoProvider;
    const type = (str(formData, "type") || "RECORDED") as LessonType;
    const providerVideoId = nullableText(str(formData, "providerVideoId"));
    const parsed = lessonInputSchema.safeParse({ lessonId: str(formData, "lessonId"), moduleId: str(formData, "moduleId"), courseId: str(formData, "courseId"), title: str(formData, "title"), description: nullableText(str(formData, "description")), type, durationSeconds: numberOrZero(formData, "durationSeconds"), provider, providerVideoId, isFreePreview: bool(formData, "isFreePreview") });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lesson details." };
    const videoError = parsed.data.type === "RECORDED" ? validateRecordedVideo(parsed.data.provider, parsed.data.providerVideoId) : null;
    if (videoError) return { ok: false, error: videoError };
    await requireLesson(parsed.data.lessonId!, parsed.data.moduleId, parsed.data.courseId);
    await prisma.$transaction(async (tx) => {
      await tx.lesson.update({ where: { id: parsed.data.lessonId }, data: { title: parsed.data.title, description: parsed.data.description, type: parsed.data.type, isFreePreview: parsed.data.isFreePreview } });
      if (parsed.data.type === "RECORDED") await tx.video.upsert({ where: { lessonId: parsed.data.lessonId! }, create: { lessonId: parsed.data.lessonId!, provider: parsed.data.provider, providerVideoId: parsed.data.providerVideoId!, durationSeconds: parsed.data.durationSeconds }, update: { provider: parsed.data.provider, providerVideoId: parsed.data.providerVideoId!, durationSeconds: parsed.data.durationSeconds } });
    });
    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    return { ok: true, message: "Lesson saved." };
  } catch (error) { return resultError(error); }
}

export async function editVideo(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const parsed = videoInputSchema.safeParse({ videoId: str(formData, "videoId"), lessonId: str(formData, "lessonId"), moduleId: str(formData, "moduleId"), courseId: str(formData, "courseId"), provider: str(formData, "provider") || "YOUTUBE", providerVideoId: str(formData, "providerVideoId"), durationSeconds: numberOrZero(formData, "durationSeconds") });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid video details." };
    await requireLesson(parsed.data.lessonId, parsed.data.moduleId, parsed.data.courseId);
    const video = await prisma.video.findFirst({ where: { id: parsed.data.videoId, lessonId: parsed.data.lessonId } });
    if (!video) return { ok: false, error: "The video does not belong to this lesson." };
    const videoError = validateRecordedVideo(parsed.data.provider, parsed.data.providerVideoId);
    if (videoError) return { ok: false, error: videoError };
    await prisma.video.update({ where: { id: parsed.data.videoId }, data: { provider: parsed.data.provider, providerVideoId: parsed.data.providerVideoId, durationSeconds: parsed.data.durationSeconds } });
    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    return { ok: true, message: "Video saved." };
  } catch (error) { return resultError(error); }
}

export async function deleteLesson(formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const id = str(formData, "id");
    const courseId = str(formData, "courseId");
    const moduleId = str(formData, "moduleId");
    await requireLesson(id, moduleId, courseId);
    await prisma.lesson.delete({ where: { id } });
    revalidatePath(`/admin/courses/${courseId}`);
    return { ok: true, message: "Lesson deleted." };
  } catch (error) { return resultError(error); }
}

// ----------------------------------------------------------- live classes --

export async function scheduleLiveSession(formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
  const id = str(formData, "id");
  await prisma.liveSession.delete({ where: { id } });
  revalidatePath("/admin/live");
}
