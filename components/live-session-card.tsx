import { format } from "date-fns";
import { Radio } from "lucide-react";
import type { LiveSession } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LiveSessionCardProps {
  session: LiveSession & { course?: { title: string } };
}

export function LiveSessionCard({ session }: LiveSessionCardProps) {
  const start = new Date(session.scheduledAt);
  const end = new Date(start.getTime() + session.durationMinutes * 60_000);
  const now = new Date();
  const isLive = now >= start && now <= end;
  const joinable = isLive || start.getTime() - now.getTime() < 15 * 60_000;

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="gap-1">
                <Radio className="h-3 w-3" /> LIVE
              </Badge>
            )}
            <p className="truncate font-medium">{session.title}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {session.course?.title ? `${session.course.title} · ` : ""}
            {format(start, "EEE, d MMM yyyy · h:mm a")} ·{" "}
            {session.durationMinutes} min ·{" "}
            {session.provider === "ZOOM" ? "Zoom" : "Google Meet"}
          </p>
        </div>
        <a
          href={joinable ? session.joinUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant={isLive ? "destructive" : "accent"}
            size="sm"
            disabled={!joinable}
          >
            {isLive ? "Join now" : joinable ? "Join" : "Upcoming"}
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
