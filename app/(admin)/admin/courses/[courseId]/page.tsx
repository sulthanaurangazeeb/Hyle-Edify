import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteLesson, deleteModule } from "@/lib/actions/admin";
import { formatDuration } from "@/lib/utils";
import { CourseForm, DeleteForm, LessonForm, ModuleForm, VideoForm } from "@/components/admin/course-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminCourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" }, include: { video: true } } } } },
  });
  if (!course) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><Link href="/admin/courses"><Button variant="ghost" size="sm">← Courses</Button></Link><h1 className="text-2xl font-bold text-hyle-navy">{course.title}</h1><Badge variant={course.isPublished ? "accent" : "secondary"}>{course.isPublished ? "Published" : "Draft"}</Badge></div>
      <Card className="max-w-2xl"><CardHeader><CardTitle className="text-base">Course settings</CardTitle></CardHeader><CardContent><CourseForm course={course} /></CardContent></Card>
      <section className="space-y-6"><h2 className="text-lg font-semibold text-hyle-navy">Content</h2>
        {course.modules.length === 0 && <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">This course has no modules yet. Add a module to begin building the syllabus.</p>}
        {course.modules.map((mod, mi) => (
          <Card key={mod.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base">Module {mi + 1}: {mod.title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Sort order: {mod.sortOrder}</p></div><div className="flex items-center gap-2"><ModuleForm courseId={course.id} module={mod} /><DeleteForm action={deleteModule} fields={{ id: mod.id, courseId: course.id }} label="Delete module" warning="Delete this module and its lessons, videos, and progress? This cannot be undone." /></div></CardHeader>
            <CardContent className="space-y-4">
              {mod.lessons.length === 0 && <p className="text-sm text-muted-foreground">No lessons in this module yet.</p>}
              {mod.lessons.length > 0 && <ul className="space-y-2">{mod.lessons.map((lesson) => <li key={lesson.id} className="rounded-md border px-3 py-2 text-sm"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><span className="font-medium">{lesson.title}</span><span className="text-muted-foreground"> · {lesson.type === "LIVE" ? "Live" : "Recorded"}{lesson.video && ` · ${lesson.video.provider} ${lesson.video.providerVideoId}`}{lesson.video && lesson.video.durationSeconds > 0 && ` · ${formatDuration(lesson.video.durationSeconds)}`}{lesson.isFreePreview && " · Free preview"}</span>{lesson.description && <p className="mt-1 text-xs text-muted-foreground">{lesson.description}</p>}</div><div className="flex items-center gap-1"><details><summary className="cursor-pointer list-none rounded-md border px-2 py-1 text-xs">Edit lesson</summary><div className="mt-3 min-w-[min(100%,42rem)]"><LessonForm courseId={course.id} moduleId={mod.id} lesson={lesson} /></div></details><DeleteForm action={deleteLesson} fields={{ id: lesson.id, moduleId: mod.id, courseId: course.id }} label="Delete lesson" warning="Delete this lesson, its video, and saved progress? This cannot be undone." /></div></div>{lesson.video && <VideoForm courseId={course.id} moduleId={mod.id} lessonId={lesson.id} video={lesson.video} />}</li>)}</ul>}
              <LessonForm courseId={course.id} moduleId={mod.id} />
            </CardContent>
          </Card>
        ))}
        <Card className="max-w-xl"><CardContent className="pt-6"><ModuleForm courseId={course.id} /></CardContent></Card>
      </section>
    </div>
  );
}
