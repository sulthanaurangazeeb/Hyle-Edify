import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function AdminStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: { include: { video: { select: { id: true } } } },
                },
              },
            },
          },
        },
      },
      videoProgress: { where: { completed: true }, select: { videoId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-hyle-navy">Students</h1>

      {students.length === 0 && (
        <p className="text-muted-foreground">No students registered yet.</p>
      )}

      <div className="space-y-4">
        {students.map((student) => {
          const completedIds = new Set(student.videoProgress.map((p) => p.videoId));
          return (
            <Card key={student.id}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {student.fullName ?? "(no name)"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.email}
                      {student.phone ? ` · ${student.phone}` : ""} · joined{" "}
                      {student.createdAt.toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {student.enrollments.length} course
                    {student.enrollments.length === 1 ? "" : "s"}
                  </p>
                </div>

                {student.enrollments.length > 0 && (
                  <div className="space-y-2">
                    {student.enrollments.map(({ course }) => {
                      const videoIds = course.modules.flatMap((m) =>
                        m.lessons.flatMap((l) => (l.video ? [l.video.id] : []))
                      );
                      const done = videoIds.filter((id) =>
                        completedIds.has(id)
                      ).length;
                      const pct =
                        videoIds.length > 0
                          ? Math.round((done / videoIds.length) * 100)
                          : 0;
                      return (
                        <div key={course.id} className="flex items-center gap-3">
                          <span className="w-64 truncate text-sm">
                            {course.title}
                          </span>
                          <Progress value={pct} className="flex-1" />
                          <span className="w-24 text-right text-sm text-muted-foreground">
                            {done}/{videoIds.length} · {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
