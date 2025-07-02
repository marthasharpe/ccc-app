import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { NavTabs } from "@/components/NavTabs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyCat - My Catholic Catechism",
  description:
    "Ask questions about Catholic doctrine and get answers based on the Catechism of the Catholic Church",
  other: {
    "apple-mobile-web-app-title": "ccc-app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link
                  href="/"
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/icon0.svg"
                    alt="MyCat"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </Link>
                <h1 className="text-m" style={{ color: '#E5A431' }}>
                  My Interactive Catechism
                </h1>
              </div>
              <NavTabs
                tabs={[
                  { href: "/chat", label: "Ask" },
                  { href: "/search", label: "Search" },
                  { href: "/about", label: "About" },
                ]}
              />
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-background">{children}</main>
      </body>
    </html>
  );
}
