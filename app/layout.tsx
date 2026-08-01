import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "Hyle Edify — Where Matter Becomes Mastery",
    template: "%s | Hyle Edify",
  },
  description:
    "Hyle Edify: recorded & live classes, NEET/JEE foundation courses, and personal progress tracking. Where Matter Becomes Mastery.",
  icons: { icon: "/brand/logo-mark.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
