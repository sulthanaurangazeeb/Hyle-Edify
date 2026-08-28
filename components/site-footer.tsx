import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-hyle-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div><Image src="/brand/logo-white.png" alt="Hyle Edify" width={201} height={100} className="h-12 w-auto opacity-95" /><p className="mt-4 max-w-xs text-sm leading-6 text-white/70">Where Matter Becomes Mastery. Building strong academic foundations for school students and future opportunities.</p><div className="mt-5 flex gap-2"><a href="https://www.instagram.com/hyleedify/" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-white/20 p-2 hover:bg-white/10"><Instagram className="h-4 w-4" /></a><a href="https://www.youtube.com/@HyleEdify" target="_blank" rel="noreferrer" aria-label="YouTube" className="rounded-full border border-white/20 p-2 hover:bg-white/10"><Youtube className="h-4 w-4" /></a><a href="https://www.facebook.com/people/Hyle-Edify-Perinthalmanna/61573563458090/" target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full border border-white/20 p-2 hover:bg-white/10"><Facebook className="h-4 w-4" /></a></div></div>
        <div><h2 className="font-semibold">Explore</h2><div className="mt-4 grid gap-3 text-sm text-white/70"><Link href="/" className="hover:text-white">Home</Link><Link href="/courses" className="hover:text-white">Courses</Link><Link href="/#students" className="hover:text-white">For students</Link><Link href="/#parents" className="hover:text-white">For parents</Link></div></div>
        <div><h2 className="font-semibold">About</h2><div className="mt-4 grid gap-3 text-sm text-white/70"><Link href="/about" className="hover:text-white">About Hyle Edify</Link><Link href="/team" className="hover:text-white">Team</Link><Link href="/achievements" className="hover:text-white">Achievements</Link><Link href="/ai-learning" className="hover:text-white">AI learning</Link></div></div>
        <div><h2 className="font-semibold">Support</h2><div className="mt-4 grid gap-3 text-sm text-white/70"><Link href="/contact#faq" className="hover:text-white">FAQ</Link><Link href="/contact" className="hover:text-white">Contact</Link><Link href="/login" className="hover:text-white">Login</Link></div></div>
        <div id="contact"><h2 className="font-semibold">Visit Hyle Edify</h2><div className="mt-4 grid gap-3 text-sm leading-5 text-white/70"><a className="flex gap-2 hover:text-white" href="https://maps.app.goo.gl/7MJzRpBvKE6s41B99" target="_blank" rel="noreferrer"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />Classic Tower, near Urban Bank, Shanti Nagar, Perinthalmanna, Kerala 679322</a><a className="flex items-center gap-2 hover:text-white" href="tel:+917736409857"><Phone className="h-4 w-4" />+91 77364 09857</a><a className="flex items-center gap-2 hover:text-white" href="mailto:hyleedify@gmail.com"><Mail className="h-4 w-4" />hyleedify@gmail.com</a></div></div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Hyle Edify. All rights reserved.</span><span>Learning with clarity, confidence, and care.</span></div></div>
    </footer>
  );
}
