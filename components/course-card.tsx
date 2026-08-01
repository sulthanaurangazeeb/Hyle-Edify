import Link from "next/link";
import type { Course } from "@prisma/client";
import { formatInr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg text-hyle-navy">
            {course.title}
          </CardTitle>
          <Badge variant="accent">{formatInr(course.priceInPaise)}</Badge>
        </div>
        {course.subtitle && (
          <CardDescription>{course.subtitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {course.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {course.description}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/courses/${course.slug}`} className="w-full">
          <Button className="w-full" variant="default">
            View course
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
