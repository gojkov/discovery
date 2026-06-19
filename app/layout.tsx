import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Syne } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const display = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "SoundsLikeMe",
  description:
    "A rejection-aware, craving-first personal music discovery system."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body>
        <Nav />
        <main className="mx-auto min-h-[calc(100vh-89px)] max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
