"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  ["Home", "/"],
  ["Courses", "/courses"],
  ["About", "/about"],
  ["Team", "/team"],
  ["Achievements", "/achievements"],
  ["AI Learning", "/ai-learning"],
  ["Contact", "/contact"],
] as const;

export function MobileNav({ isLoggedIn = false, role }: { isLoggedIn?: boolean; role?: "STUDENT" | "TEACHER" | "ADMIN" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sm:hidden">
      <Button variant="ghost" size="icon" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X /> : <Menu />}
      </Button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b bg-background px-4 py-4 shadow-lg">
          <nav className="mx-auto grid max-w-6xl gap-1" aria-label="Mobile navigation">
            {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary">{label}</Link>)}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-3">
              {isLoggedIn ? <><Link href="/dashboard" onClick={() => setOpen(false)}><Button variant="secondary" className="w-full">Dashboard</Button></Link>{role === "ADMIN" && <Link href="/admin" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Admin</Button></Link>}<form action="/auth/signout" method="post" className="col-span-2"><Button type="submit" variant="ghost" className="w-full">Sign out</Button></form></> : <><Link href="/login" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Login</Button></Link><Link href="/register" onClick={() => setOpen(false)}><Button variant="accent" className="w-full">Start Learning</Button></Link></>}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
