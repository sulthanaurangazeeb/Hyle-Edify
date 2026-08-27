import Image from "next/image";
import Link from "next/link";
import type { Course } from "@prisma/client";
import { ArrowUpRight, BookOpen, PlayCircle } from "lucide-react";
import { formatInr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function safeImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith("supabase.co") ? url : null;
  } catch { return null; }
}

type CourseCardData = Pick<Course, "id" | "title" | "slug" | "priceInPaise" | "thumbnailUrl" | "subtitle" | "description">;

function fallbackLabel(course: CourseCardData) {
  const text = `${course.title} ${course.slug}`.toLowerCase();
  if (text.includes("9") || text.includes("neet") || text.includes("jee")) return "NEET / JEE foundation";
  if (text.includes("8")) return "Physics · Biology · Mathematics";
  if (text.includes("7")) return "Science · Mathematics · Curiosity";
  if (text.includes("6")) return "Science + Mathematics";
  return "Science + Mathematics foundation";
}
export function CourseCard({ course }: { course: CourseCardData }) {
  const imageUrl = safeImageUrl(course.thumbnailUrl);
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-hyle-green/50 hover:shadow-xl">
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {imageUrl ? <Image src={imageUrl} alt={`${course.title} course thumbnail`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#d9efc9,transparent_35%),linear-gradient(135deg,#eef6f9,#dbeaf0)] p-5 text-hyle-navy"><div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[16px] border-hyle-green/25" /><div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full border-[18px] border-hyle-navy/10" /><div className="relative flex h-full flex-col justify-between"><BookOpen className="h-9 w-9 text-hyle-green" /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-hyle-green">Branded course artwork</p><span className="mt-1 block text-sm font-bold text-hyle-navy">{fallbackLabel(course)}</span></div></div></div>}
        <div className="absolute left-3 top-3"><Badge variant="secondary" className="bg-white/90 shadow-sm">Foundation programme</Badge></div>
      </div>
      <CardHeader className="gap-3 pb-3"><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg leading-tight text-hyle-navy">{course.title}</CardTitle><span className="shrink-0 text-sm font-bold text-hyle-navy">{course.priceInPaise === 0 ? "Free" : formatInr(course.priceInPaise)}</span></div>{course.subtitle && <p className="text-sm text-muted-foreground">{course.subtitle}</p>}</CardHeader>
      <CardContent className="flex-1 space-y-3"><p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{course.description ?? "Build confident foundations through structured lessons and guided learning."}</p><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><PlayCircle className="h-4 w-4 text-hyle-green" />Live + recorded learning</div></CardContent>
      <CardFooter><Link href={`/courses/${course.slug}`} className="w-full"><Button className="w-full justify-between font-semibold" variant="default">Explore course <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Button></Link></CardFooter>
    </Card>
  );
}
