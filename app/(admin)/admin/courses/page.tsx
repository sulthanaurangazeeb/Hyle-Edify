import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/course-forms";
import { formatInr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { enrollments: true, modules: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-hyle-navy">Courses</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {courses.length === 0 && <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No courses yet. Create the first one below.</p>}
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
          <CourseForm />
        </CardContent>
      </Card>
    </div>
  );
}
