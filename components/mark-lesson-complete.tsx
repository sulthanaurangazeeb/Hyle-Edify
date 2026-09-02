"use client";

import { useActionState } from "react";
import { markLessonComplete, type ProgressActionResult } from "@/lib/actions/progress";
import { Button } from "@/components/ui/button";

const initialState: ProgressActionResult = { ok: false };

export function MarkLessonComplete({
  lessonId,
  courseSlug,
  completed,
}: {
  lessonId: string;
  courseSlug: string;
  completed: boolean;
}) {
  const [state, action, pending] = useActionState(
    async () => markLessonComplete(lessonId, courseSlug),
    initialState
  );

  return (
    <div className="space-y-2">
      <form action={action}>
        <Button type="submit" variant={completed ? "outline" : "accent"} disabled={completed || pending}>
          {completed ? "Completed" : pending ? "Saving…" : "Mark lesson complete"}
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.message && <p className="text-xs text-hyle-green">{state.message}</p>}
    </div>
  );
}
