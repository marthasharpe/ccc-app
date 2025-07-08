"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isLoading) {
    return <div className="w-20 h-9 bg-muted animate-pulse rounded-md"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          className="hidden md:inline-flex"
          variant="outline"
          size="sm"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </Link>
      <Link href="/auth/signup" className="hidden sm:inline">
        <Button size="sm">
          Sign Up
        </Button>
      </Link>
    </div>
  );
}
