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
];

const accountTab = { href: "/account", label: "Account" };

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
  const tabs = user ? [...baseTabs, accountTab] : baseTabs;

  return (
    <>
      <div className="hidden md:block">
        <NavTabs tabs={tabs} />
      </div>
      <div className="md:hidden">
        <MobileNav tabs={tabs} />
      </div>
    </>
  );
}