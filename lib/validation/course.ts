import { z } from "zod";

export const idSchema = z.string().uuid("A valid ID is required.");
const id = idSchema;
const nonNegativeNumber = z.number().finite().min(0);
export const MAX_VIDEO_DURATION_SECONDS = 24 * 60 * 60;
const videoDuration = z.number().finite().int().min(0).max(MAX_VIDEO_DURATION_SECONDS, "Video duration is unreasonably long.");

export const courseInputSchema = z.object({
  title: z.string().trim().min(1, "Course title is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Course slug is required.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  subtitle: z.string().trim().max(300).nullable(),
  description: z.string().trim().max(10000).nullable(),
  priceRupees: nonNegativeNumber,
  thumbnailUrl: z
    .string()
    .trim()
    .url("Thumbnail must be a valid URL.")
    .refine((value) => /^https?:\/\//i.test(value), "Thumbnail must use http or https.")
    .nullable(),
  isPublished: z.boolean(),
});

export const moduleInputSchema = z.object({
  moduleId: id.optional(),
  courseId: id,
  title: z.string().trim().min(1, "Module title is required.").max(200),
  sortOrder: nonNegativeNumber,
});

const lessonType = z.enum(["RECORDED", "LIVE"]);

export const lessonInputSchema = z.object({
  lessonId: id.optional(),
  moduleId: id,
  courseId: id,
  title: z.string().trim().min(1, "Lesson title is required.").max(200),
  description: z.string().trim().max(10000).nullable(),
  type: lessonType,
  durationSeconds: videoDuration,
  provider: z.enum(["YOUTUBE", "VIMEO", "MUX"]),
  providerVideoId: z.string().trim().max(255).nullable(),
  isFreePreview: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.type === "RECORDED" && data.durationSeconds <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["durationSeconds"], message: "Recorded videos must have a duration greater than 0 seconds." });
  }
});

export const videoInputSchema = z.object({
  videoId: id,
  lessonId: id,
  moduleId: id,
  courseId: id,
  provider: z.enum(["YOUTUBE", "VIMEO", "MUX"]),
  providerVideoId: z.string().trim().min(1).max(255),
  durationSeconds: z.number().finite().int().min(1, "Video duration must be greater than 0 seconds.").max(MAX_VIDEO_DURATION_SECONDS, "Video duration is unreasonably long."),
});

export function validateRecordedVideo(provider: string, providerVideoId: string | null) {
  if (!providerVideoId) return "A video ID is required for recorded lessons.";
  if (provider === "YOUTUBE" && !/^[A-Za-z0-9_-]{11}$/.test(providerVideoId)) {
    return "YouTube video IDs must be 11 characters.";
  }
  return null;
}

export function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
