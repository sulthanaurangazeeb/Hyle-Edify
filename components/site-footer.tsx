import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t bg-hyle-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center">
        <Image
          src="/brand/logo-white.png"
          alt="Hyle Edify"
          width={201}
          height={100}
          className="h-12 w-auto opacity-90"
        />
        <p className="text-sm font-medium tracking-wide text-white/80">
          Where Matter Becomes Mastery
        </p>
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} Hyle Edify. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
