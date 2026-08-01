import Image from "next/image";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20">
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

        <nav className="flex items-center gap-2">
          <Link
            href="/#courses"
            className="hidden px-3 text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            Courses
          </Link>
          {user ? (
            <>
              {user.role !== "STUDENT" && (
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
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="accent" size="sm" className="font-semibold">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
