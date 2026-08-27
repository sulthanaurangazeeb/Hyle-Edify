"use client";

import { useActionState, useState } from "react";
import {
  addLesson,
  addModule,
  deleteLesson,
  deleteModule,
  editLesson,
  editModule,
  editVideo,
  saveCourse,
  type AdminActionResult,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionResult = { ok: false };

function Feedback({ state }: { state: AdminActionResult }) {
  if (!state.message && !state.error) return null;
  return <p className={state.ok ? "text-sm text-green-700" : "text-sm text-destructive"}>{state.message ?? state.error}</p>;
}

function useAdminAction(action: (formData: FormData) => Promise<AdminActionResult>) {
  return useActionState(async (_previous: AdminActionResult, formData: FormData) => action(formData), initial);
}

export function CourseForm({ course }: { course?: { id: string; title: string; slug: string; subtitle: string | null; description: string | null; priceInPaise: number; thumbnailUrl: string | null; isPublished: boolean } }) {
  const [state, formAction, pending] = useAdminAction(saveCourse);
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnailUrl ?? "");
  return (
    <form action={formAction} className="space-y-4">
      {course && <input type="hidden" name="id" value={course.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor={`course-title-${course?.id ?? "new"}`}>Title</Label><Input id={`course-title-${course?.id ?? "new"}`} name="title" defaultValue={course?.title} required maxLength={200} /></div>
        <div className="space-y-1.5"><Label htmlFor={`course-slug-${course?.id ?? "new"}`}>Slug (URL)</Label><Input id={`course-slug-${course?.id ?? "new"}`} name="slug" defaultValue={course?.slug} placeholder="class-9-foundation" required maxLength={120} /></div>
      </div>
      <div className="space-y-1.5"><Label>Subtitle</Label><Input name="subtitle" defaultValue={course?.subtitle ?? ""} maxLength={300} /></div>
      <div className="space-y-1.5"><Label>Description</Label><textarea name="description" rows={3} defaultValue={course?.description ?? ""} maxLength={10000} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      <div className="space-y-1.5"><Label>Thumbnail URL</Label><Input name="thumbnailUrl" type="url" value={thumbnailUrl} onChange={(event) => setThumbnailUrl(event.target.value)} placeholder="https://..." />{thumbnailUrl && <a href={thumbnailUrl} target="_blank" rel="noreferrer" className="inline-block text-xs text-primary underline">Open thumbnail preview</a>}</div>
      <div className="flex items-end gap-4">
        <div className="space-y-1.5"><Label>Price (₹)</Label><Input name="priceRupees" type="number" min={0} step="0.01" defaultValue={course ? course.priceInPaise / 100 : undefined} required /></div>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked={course?.isPublished} className="h-4 w-4" />Published</label>
      </div>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving…" : course ? "Save changes" : "Create course"}</Button><Feedback state={state} /></div>
    </form>
  );
}

export function ModuleForm({ courseId, module }: { courseId: string; module?: { id: string; title: string; sortOrder: number } }) {
  const [editing, setEditing] = useState(!module);
  const [state, formAction, pending] = useAdminAction(module ? editModule : addModule);
  if (module && !editing) return <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>Edit module</Button>;
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      {module && <input type="hidden" name="moduleId" value={module.id} />}
      {module ? <div className="flex items-center gap-2"><Input name="title" defaultValue={module.title} required maxLength={200} /><Input name="sortOrder" type="number" min={0} defaultValue={module.sortOrder} className="w-24" /><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div> : <div className="flex items-end gap-3"><div className="flex-1 space-y-1.5"><Label>New module title</Label><Input name="title" required maxLength={200} placeholder="Module title" /></div><Button type="submit" variant="secondary" disabled={pending}>{pending ? "Adding…" : "Add module"}</Button></div>}
      <Feedback state={state} />
    </form>
  );
}

export function LessonForm({ courseId, moduleId, lesson }: { courseId: string; moduleId: string; lesson?: { id: string; title: string; description: string | null; type: "RECORDED" | "LIVE"; isFreePreview: boolean; video: { id: string; provider: "YOUTUBE" | "VIMEO" | "MUX"; providerVideoId: string; durationSeconds: number } | null } }) {
  const [state, formAction, pending] = useAdminAction(lesson ? editLesson : addLesson);
  const video = lesson?.video;
  return (
    <form action={formAction} className="grid items-end gap-3 rounded-md bg-muted/50 p-3 sm:grid-cols-6">
      <input type="hidden" name="moduleId" value={moduleId} /><input type="hidden" name="courseId" value={courseId} />{lesson && <input type="hidden" name="lessonId" value={lesson.id} />}
      <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Lesson title</Label><Input name="title" defaultValue={lesson?.title} required maxLength={200} placeholder="Introduction to Algebra" /></div>
      <div className="space-y-1"><Label className="text-xs">Type</Label><select name="type" defaultValue={lesson?.type ?? "RECORDED"} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="RECORDED">Recorded</option><option value="LIVE">Live</option></select></div>
      <div className="space-y-1"><Label className="text-xs">Provider</Label><select name="provider" defaultValue={video?.provider ?? "YOUTUBE"} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="YOUTUBE">YouTube</option><option value="VIMEO">Vimeo</option><option value="MUX">Mux</option></select></div>
      <div className="space-y-1"><Label className="text-xs">Video ID</Label><Input name="providerVideoId" defaultValue={video?.providerVideoId} placeholder="YouTube ID" /></div>
      <div className="space-y-1"><Label className="text-xs">Video duration (seconds)</Label><Input name="durationSeconds" type="number" min={0} step={1} defaultValue={video?.durationSeconds ?? 0} /><p className="text-[11px] text-muted-foreground">Enter the actual video duration. Example: 18:05 = 1085 seconds.</p></div>
      <div className="space-y-1 sm:col-span-4"><Label className="text-xs">Description</Label><textarea name="description" rows={2} defaultValue={lesson?.description ?? ""} maxLength={10000} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
      <div className="flex items-center gap-3"><label className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="isFreePreview" defaultChecked={lesson?.isFreePreview} className="h-3.5 w-3.5" />Free preview</label><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : lesson ? "Save lesson" : "Add lesson"}</Button></div>
      <div className="sm:col-span-6"><Feedback state={state} /></div>
    </form>
  );
}

export function VideoForm({ courseId, moduleId, lessonId, video }: { courseId: string; moduleId: string; lessonId: string; video: { id: string; provider: "YOUTUBE" | "VIMEO" | "MUX"; providerVideoId: string; durationSeconds: number } }) {
  const [state, formAction, pending] = useAdminAction(editVideo);
  return <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2 rounded-md border bg-background p-2"><input type="hidden" name="courseId" value={courseId} /><input type="hidden" name="moduleId" value={moduleId} /><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="videoId" value={video.id} /><select name="provider" defaultValue={video.provider} className="h-8 rounded-md border border-input bg-background px-2 text-xs"><option value="YOUTUBE">YouTube</option><option value="VIMEO">Vimeo</option><option value="MUX">Mux</option></select><Input name="providerVideoId" defaultValue={video.providerVideoId} className="h-8 w-40 text-xs" /><div><Label className="text-[11px]">Video duration (seconds)</Label><Input name="durationSeconds" type="number" min={1} step={1} defaultValue={video.durationSeconds} className="h-8 w-24 text-xs" /><p className="text-[11px] text-muted-foreground">18:05 = 1085 seconds</p></div><Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Saving…" : "Edit video"}</Button><Feedback state={state} /></form>;
}

export function DeleteForm({ action, fields, label, warning }: { action: (formData: FormData) => Promise<AdminActionResult>; fields: Record<string, string>; label: string; warning: string }) {
  const [state, formAction, pending] = useAdminAction(action);
  return <form action={formAction} onSubmit={(event) => { if (!window.confirm(warning)) event.preventDefault(); }}><>{Object.entries(fields).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}</><Button variant="ghost" size="icon" type="submit" title={label} disabled={pending}><span className="sr-only">{label}</span><span className="text-destructive">×</span></Button><Feedback state={state} /></form>;
}
