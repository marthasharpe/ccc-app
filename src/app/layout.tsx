import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "MyCat - Catechism Search",
  description: "Search the Catechism of the Catholic Church",
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
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
                  MyCat
                </Link>
                <span className="text-sm text-muted-foreground">
                  Catechism Search
                </span>
              </div>
              <nav className="flex items-center space-x-4">
                <a
                  href="/search"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Search
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
