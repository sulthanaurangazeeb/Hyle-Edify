import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  addLesson,
  addModule,
  deleteLesson,
  deleteModule,
  saveCourse,
} from "@/lib/actions/admin";
import { formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminCourseEditorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: { video: true },
          },
        },
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-hyle-navy">{course.title}</h1>
        <Badge variant={course.isPublished ? "accent" : "secondary"}>
          {course.isPublished ? "Published" : "Draft"}
        </Badge>
      </div>

      {/* Course settings */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Course settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveCourse} className="space-y-4">
            <input type="hidden" name="id" value={course.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={course.title} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={course.slug} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" name="subtitle" defaultValue={course.subtitle ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={course.description ?? ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-end gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="priceRupees">Price (₹)</Label>
                <Input
                  id="priceRupees"
                  name="priceRupees"
                  type="number"
                  min={1}
                  defaultValue={course.priceInPaise / 100}
                  required
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  name="isPublished"
                  defaultChecked={course.isPublished}
                  className="h-4 w-4"
                />
                Published
              </label>
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Modules & lessons */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-hyle-navy">Content</h2>

        {course.modules.map((mod, mi) => (
          <Card key={mod.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">
                Module {mi + 1}: {mod.title}
              </CardTitle>
              <form action={deleteModule}>
                <input type="hidden" name="id" value={mod.id} />
                <Button variant="ghost" size="icon" type="submit" title="Delete module">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </form>
            </CardHeader>
            <CardContent className="space-y-4">
              {mod.lessons.length > 0 && (
                <ul className="space-y-2">
                  {mod.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-medium">{lesson.title}</span>{" "}
                        <span className="text-muted-foreground">
                          · {lesson.type === "LIVE" ? "Live" : "Recorded"}
                          {lesson.video &&
                            ` · ${lesson.video.provider} ${lesson.video.providerVideoId}`}
                          {lesson.video &&
                            lesson.video.durationSeconds > 0 &&
                            ` · ${formatDuration(lesson.video.durationSeconds)}`}
                          {lesson.isFreePreview && " · Free preview"}
                        </span>
                      </div>
                      <form action={deleteLesson}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <input type="hidden" name="courseId" value={course.id} />
                        <Button variant="ghost" size="icon" type="submit" title="Delete lesson">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add lesson */}
              <form
                action={addLesson}
                className="grid items-end gap-3 rounded-md bg-muted/50 p-3 sm:grid-cols-6"
              >
                <input type="hidden" name="moduleId" value={mod.id} />
                <input type="hidden" name="courseId" value={course.id} />
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Lesson title</Label>
                  <Input name="title" required placeholder="Introduction to Algebra" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select
                    name="type"
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="RECORDED">Recorded</option>
                    <option value="LIVE">Live</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">YouTube video ID</Label>
                  <Input name="providerVideoId" placeholder="dQw4w9WgXcQ" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duration (sec)</Label>
                  <Input name="durationSeconds" type="number" min={0} placeholder="600" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" name="isFreePreview" className="h-3.5 w-3.5" />
                    Free
                  </label>
                  <Button type="submit" size="sm">
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}

        {/* Add module */}
        <form action={addModule} className="flex max-w-md items-end gap-3">
          <input type="hidden" name="courseId" value={course.id} />
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="new-module">New module title</Label>
            <Input id="new-module" name="title" required placeholder="Module title" />
          </div>
          <Button type="submit" variant="secondary">
            Add module
          </Button>
        </form>
      </section>
    </div>
  );
}
