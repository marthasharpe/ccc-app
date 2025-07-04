"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

interface NavTab {
  href: string;
  label: string;
}

interface MobileNavProps {
  tabs: NavTab[];
}

export function MobileNav({ tabs }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    closeMenu();
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <div
            className={cn(
              "w-5 h-0.5 bg-foreground transition-all duration-300 ease-in-out",
              isOpen && "rotate-45 translate-y-1.5"
            )}
          />
          <div
            className={cn(
              "w-5 h-0.5 bg-foreground transition-all duration-300 ease-in-out mt-1",
              isOpen && "opacity-0"
            )}
          />
          <div
            className={cn(
              "w-5 h-0.5 bg-foreground transition-all duration-300 ease-in-out mt-1",
              isOpen && "-rotate-45 -translate-y-1.5"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
          <div className="py-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={closeMenu}
                  className={cn(
                    "block px-4 py-2 text-sm transition-colors hover:bg-muted hover:text-muted-foreground",
                    isActive && "bg-muted text-muted-foreground font-medium"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
            
            {/* Sign out button for mobile - only show if user is authenticated */}
            {user && (
              <div className="border-t mt-1 pt-1">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start px-4 py-2 h-auto text-sm font-normal hover:bg-muted hover:text-muted-foreground"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </div>
  );
}