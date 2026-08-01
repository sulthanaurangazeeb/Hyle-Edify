import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveCourse } from "@/lib/actions/admin";
import { formatInr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { enrollments: true, modules: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-hyle-navy">Courses</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{course.title}</CardTitle>
                <Badge variant={course.isPublished ? "accent" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {formatInr(course.priceInPaise)} · {course._count.modules}{" "}
                modules · {course._count.enrollments} enrolled
              </p>
              <Link href={`/admin/courses/${course.id}`}>
                <Button size="sm" variant="outline">
                  Manage content
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Add a new course</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveCourse} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input id="slug" name="slug" placeholder="class-9-foundation" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" name="subtitle" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
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
                  step={1}
                  required
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="isPublished" className="h-4 w-4" />
                Publish immediately
              </label>
            </div>
            <Button type="submit">Create course</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
