import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Steve Discovery Engine",
  description: "A rejection-aware, craving-first personal music discovery system."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto min-h-[calc(100vh-90px)] max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
