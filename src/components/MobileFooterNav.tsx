"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { MessageCircle, Search, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User as AuthUser } from "@supabase/supabase-js";

const baseNavItems = [
  {
    name: "Search",
    href: "/search",
    icon: Search,
    requiresAuth: false,
  },
  {
    name: "Ask",
    href: "/chat",
    icon: MessageCircle,
    requiresAuth: false,
  },
];

const authNavItems = [
  {
    name: "Saved",
    href: "/saved-responses",
    icon: Bookmark,
    requiresAuth: true,
  },
  {
    name: "Account",
    href: "/account",
    icon: User,
    requiresAuth: true,
  },
];

const loginNavItem = {
  name: "Login",
  href: "/auth/login",
  icon: User,
  requiresAuth: false,
};

export function MobileFooterNav() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Build navigation items based on auth state
  const navItems = user
    ? [...baseNavItems, ...authNavItems]
    : [...baseNavItems, loginNavItem];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/chat" && pathname === "/") ||
              (item.href === "/saved-responses" &&
                pathname.startsWith("/saved-responses"));

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[60px] min-h-[48px] touch-manipulation",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </footer>
  );
}
