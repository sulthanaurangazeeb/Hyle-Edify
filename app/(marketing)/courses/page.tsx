import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/course-card";
import { PageHero } from "@/components/marketing/blocks";

export const metadata: Metadata = { title: "Foundation Programs | Hyle Edify", description: "Explore early competitive-exam preparation from Class 6 onwards, with Science and Mathematics foundations for future NEET and JEE pathways." };
export const revalidate = 300;

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" }, select: { id: true, title: true, slug: true, priceInPaise: true, thumbnailUrl: true, subtitle: true, description: true } });
  return <><PageHero eyebrow="Foundation programmes" title="A clear place to begin." description="Explore the current published courses and choose a thoughtful next step for your learner." /><section className="bg-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">{courses.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div> : <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">New foundation programmes will appear here soon.</div>}</div></section></>;
}
