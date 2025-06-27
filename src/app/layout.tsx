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
                  CathCat
                </Link>
              </div>
              <nav className="flex items-center space-x-4">
                <Link
                  href="/chat"
                  className="text-sm font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Chat
                </Link>
                <Link
                  href="/search"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Search
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-background">{children}</main>
      </body>
    </html>
  );
}
