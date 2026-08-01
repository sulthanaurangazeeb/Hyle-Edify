import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser(); // middleware guards too; this is defense in depth

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">{children}</main>
      <SiteFooter />
    </div>
  );
}
