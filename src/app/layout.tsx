import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "CathCat - Catholic Catechism Assistant",
  description:
    "Ask questions about Catholic doctrine and get answers based on the Catechism of the Catholic Church",
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
                  className="text-xl font-bold hover:text-primary transition-colors"
                >
                  MyCat
                </Link>
                <span className="text-sm text-muted-foreground">
                  My Catholic Catechism
                </span>
              </div>
              <NavTabs
                tabs={[
                  { href: "/chat", label: "Chat" },
                  { href: "/search", label: "Search" },
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
