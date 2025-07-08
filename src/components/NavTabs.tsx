"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavTab {
  href: string;
  label: string;
}

interface NavTabsProps {
  tabs: NavTab[];
}

export function NavTabs({ tabs }: NavTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center">
      <div className="inline-flex h-10 items-center justify-center p-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all cursor-pointer",
                "hover:bg-background/80 hover:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "relative",
                isActive && [
                  "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-0.5 after:bg-primary",
                ]
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
