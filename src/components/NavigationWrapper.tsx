"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { NavTabs } from "./NavTabs";
import { MobileNav } from "./MobileNav";

const baseTabs = [
  { href: "/chat", label: "Ask" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const mobileHeaderTabs = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const authedTabs = [
  { href: "/saved-responses", label: "Saved" },
  { href: "/account", label: "Account" },
];

export function NavigationWrapper() {
  const [user, setUser] = useState<User | null>(null);
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

  // Add account tab only if user is authenticated
  const desktopTabs = user ? [...baseTabs, ...authedTabs] : baseTabs;
  const mobileTabs = mobileHeaderTabs;

  return (
    <>
      <div className="hidden md:block">
        <NavTabs tabs={desktopTabs} />
      </div>
      <div className="md:hidden">
        <MobileNav tabs={mobileTabs} />
      </div>
    </>
  );
}
