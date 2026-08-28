import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHero({ eyebrow, title, description, dark = false, children }: { eyebrow: string; title: string; description: string; dark?: boolean; children?: React.ReactNode }) {
  return <section className={dark ? "bg-hyle-navy text-white" : "bg-[#f6faf8]"}><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><p className={dark ? "text-sm font-bold uppercase tracking-[0.18em] text-[#b6e993]" : "text-sm font-bold uppercase tracking-[0.18em] text-hyle-green"}>{eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">{title}</h1><p className={dark ? "mt-5 max-w-2xl text-lg leading-8 text-white/70" : "mt-5 max-w-2xl text-lg leading-8 text-slate-600"}>{description}</p>{children}</div></section>;
}

export function SectionHeading({ eyebrow, title, description, align = "left", dark = false }: { eyebrow: string; title: string; description?: string; align?: "left" | "center"; dark?: boolean }) {
  return <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}><p className={dark ? "text-sm font-bold uppercase tracking-[0.18em] text-[#b6e993]" : "text-sm font-bold uppercase tracking-[0.18em] text-hyle-green"}>{eyebrow}</p><h2 className={dark ? "mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl" : "mt-3 text-3xl font-bold tracking-tight text-hyle-navy sm:text-4xl"}>{title}</h2>{description && <p className={dark ? "mt-4 leading-7 text-white/70" : "mt-4 leading-7 text-slate-600"}>{description}</p>}</div>;
}

export function FeatureCard({ icon: Icon, title, children, dark = false }: { icon: LucideIcon; title: string; children: React.ReactNode; dark?: boolean }) {
  return <article className={dark ? "rounded-2xl border border-white/15 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10" : "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"}><Icon className={dark ? "h-8 w-8 text-[#b6e993]" : "h-8 w-8 text-hyle-green"} /><h3 className={dark ? "mt-6 text-lg font-semibold text-white" : "mt-6 text-lg font-semibold text-hyle-navy"}>{title}</h3><p className={dark ? "mt-2 leading-7 text-white/65" : "mt-2 leading-7 text-slate-600"}>{children}</p></article>;
}

export function CTASection({ title, text, href = "/courses", label = "Explore courses" }: { title: string; text: string; href?: string; label?: string }) {
  return <section className="bg-hyle-navy"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div><h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2><p className="mt-2 max-w-xl leading-7 text-white/65">{text}</p></div><Link href={href} className="shrink-0"><Button size="lg" variant="accent" className="font-semibold">{label}<ArrowRight className="h-4 w-4" /></Button></Link></div></section>;
}

export function FAQList({ items }: { items: Array<[string, string]> }) {
  return <div className="divide-y rounded-2xl border bg-white px-5">{items.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-hyle-navy [&::-webkit-details-marker]:hidden">{question}<ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" /></summary><p className="mt-3 max-w-3xl pr-8 text-sm leading-6 text-slate-600">{answer}</p></details>)}</div>;
}

export function CheckList({ items }: { items: string[] }) {
  return <ul className="grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item} className="flex gap-3 rounded-xl border bg-white p-4 text-sm font-medium text-hyle-navy"><CheckCircle2 className="h-5 w-5 shrink-0 text-hyle-green" />{item}</li>)}</ul>;
}
