import Image from "next/image";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Hyle Edify"
            width={241}
            height={120}
            priority
            className="h-11 w-auto sm:h-14"
          />
        </Link>

        <nav className="hidden items-center gap-0 lg:gap-1 sm:flex" aria-label="Primary navigation">
          <Link href="/" className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-hyle-navy">Home</Link>
          <Link href="/courses" className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-hyle-navy">Courses</Link>
          <Link href="/about" className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-hyle-navy">About</Link>
          <Link href="/team" className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-hyle-navy">Team</Link>
          <Link href="/achievements" className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-hyle-navy">Achievements</Link>
          <Link href="/ai-learning" className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-hyle-navy">AI Learning</Link>
          <Link href="/contact" className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-hyle-navy">Contact</Link>
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  Dashboard
                </Button>
              </Link>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="accent" size="sm" className="font-semibold">
                  Start Learning
                </Button>
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:hidden"><MobileNav isLoggedIn={!!user} role={user?.role} /></div>
      </div>
    </header>
  );
}
