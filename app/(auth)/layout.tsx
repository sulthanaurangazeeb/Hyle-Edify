import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary via-background to-secondary/60 px-4 py-10">
      <Link href="/" className="mb-8 transition-opacity hover:opacity-80">
        <Image
          src="/brand/logo-horizontal.png"
          alt="Hyle Edify"
          width={281}
          height={140}
          priority
          className="h-20 w-auto drop-shadow-sm"
        />
      </Link>
      {children}
      <p className="mt-8 text-sm font-medium tracking-wide text-hyle-navy/70">
        Where <span className="text-hyle-green">Matter</span> Becomes{" "}
        <span className="text-hyle-green">Mastery</span>
      </p>
    </div>
  );
}
