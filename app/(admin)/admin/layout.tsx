import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/live", label: "Live classes" },
  { href: "/admin/students", label: "Students" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r bg-hyle-navy text-white md:flex">
        <Link href="/" className="flex items-center gap-2 border-b border-white/10 p-4">
          <Image
            src="/brand/logo-white.png"
            alt="Hyle Edify"
            width={201}
            height={100}
            className="h-10 w-auto"
          />
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-white/60">
          {user.email}
          <br />
          <span className="uppercase">{user.role}</span>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b px-4 md:justify-end">
          <div className="flex gap-2 md:hidden">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Student view
              </Button>
            </Link>
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
