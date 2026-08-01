import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteLiveSession, scheduleLiveSession } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminLivePage() {
  const [sessions, courses] = await Promise.all([
    prisma.liveSession.findMany({
      include: { course: { select: { title: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 50,
    }),
    prisma.course.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-hyle-navy">Live classes</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Schedule a live class</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={scheduleLiveSession} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="courseId">Course</Label>
                <select
                  id="courseId"
                  name="courseId"
                  required
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Session title</Label>
                <Input id="title" name="title" required placeholder="Doubt clearing — Algebra" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="scheduledAt">Date & time</Label>
                <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="durationMinutes">Duration (min)</Label>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min={15}
                  defaultValue={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="provider">Platform</Label>
                <select
                  id="provider"
                  name="provider"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="GOOGLE_MEET">Google Meet</option>
                  <option value="ZOOM">Zoom</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joinUrl">Join link</Label>
              <Input
                id="joinUrl"
                name="joinUrl"
                type="url"
                required
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </div>
            <Button type="submit">Schedule</Button>
          </form>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-hyle-navy">All sessions</h2>
        <div className="space-y-2">
          {sessions.length === 0 && (
            <p className="text-muted-foreground">No live classes scheduled yet.</p>
          )}
          {sessions.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.course.title} ·{" "}
                    {format(new Date(s.scheduledAt), "EEE, d MMM yyyy · h:mm a")} ·{" "}
                    {s.durationMinutes} min ·{" "}
                    {s.provider === "ZOOM" ? "Zoom" : "Google Meet"}
                  </p>
                </div>
                <form action={deleteLiveSession}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button variant="ghost" size="icon" type="submit" title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
