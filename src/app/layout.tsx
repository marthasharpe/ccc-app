import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "@/components/AuthButton";
import { NavigationWrapper } from "@/components/NavigationWrapper";
import { MobileFooterNav } from "@/components/MobileFooterNav";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ChatProvider } from "@/contexts/ChatContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { Analytics } from "@vercel/analytics/next";
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
  title: "Truth Me Up - An Interactive Catechism",
  description:
    "Ask questions about Catholic doctrine and get answers based on the Catechism of the Catholic Church",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
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
        data-lastpass-ignore
      >
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-2 py-1 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between min-h-[56px]">
              <Link
                href="/"
                className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="flex items-center">
                  <Image
                    src="/icon-transparent.svg"
                    alt="Truth Me Up logo"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                  <h1 className="text-lg">Truth Me Up</h1>
                </div>
              </Link>

              <div className="flex items-center gap-4">
                <NavigationWrapper />
                <div className="hidden md:block">
                  <AuthButton />
                </div>
              </div>
            </div>
          </div>
        </header>
        <Analytics />
        <ScrollToTop />
        <ChatProvider>
          <SearchProvider>
            <main className="min-h-screen bg-background pb-20 md:pb-0">
              {children}
            </main>
            <MobileFooterNav />
          </SearchProvider>
        </ChatProvider>
      </body>
    </html>
  );
}
