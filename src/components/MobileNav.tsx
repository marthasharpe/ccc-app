"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavTab {
  href: string;
  label: string;
}

interface MobileNavProps {
  tabs: NavTab[];
}

export function MobileNav({ tabs }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
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
        <div className="fixed left-0 right-0 top-full bg-background border shadow-lg z-50 text-right">
          <div className="py-2">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={closeMenu}
                  className={cn(
                    "block px-6 py-4 text-lg transition-colors hover:bg-muted hover:text-muted-foreground",
                    isActive && "bg-muted text-muted-foreground font-medium"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
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
