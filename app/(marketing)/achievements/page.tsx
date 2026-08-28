import type { Metadata } from "next";
import { ArrowRight, FlaskConical, Medal, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CTASection, FeatureCard, PageHero, SectionHeading } from "@/components/marketing/blocks";

export const metadata: Metadata = { title: "Achievements | Hyle Edify", description: "A home for verified Hyle Edify student achievements, projects, scholarships, and milestones." };

export default function AchievementsPage() {
  return <><PageHero eyebrow="Student achievements & success" title="A space for real stories." description="We will publish verified student achievements, projects, scholarships, and milestones here as official records become available."><Link href="/contact" className="mt-8 inline-flex"><Button size="lg" variant="accent">Share an official record <ArrowRight className="h-4 w-4" /></Button></Link></PageHero><section className="bg-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="What this space will hold" title="Celebrate the work, not just the result." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><FeatureCard icon={Medal} title="Olympiad achievements">Verified Olympiad participation and achievements will be added with official details.</FeatureCard><FeatureCard icon={Trophy} title="Foundation milestones">A place for verified NEET/JEE foundation milestones and learning progress stories.</FeatureCard><FeatureCard icon={FlaskConical} title="Student projects">Curious projects and thoughtful work from Hyle Edify learners.</FeatureCard><FeatureCard icon={Sparkles} title="Scholarships">Official scholarship stories will be shared when records are available.</FeatureCard><FeatureCard icon={Trophy} title="Awards and recognition">Verified awards and recognitions, presented with the right context.</FeatureCard><FeatureCard icon={Sparkles} title="Coming soon">The first verified student stories will appear here soon.</FeatureCard></div></div></section><CTASection title="Have a verified story to share?" text="Get in touch with Hyle Edify so we can review and publish it responsibly." href="/contact" label="Contact Hyle Edify" /></>;
}

