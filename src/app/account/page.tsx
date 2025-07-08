"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { getUserStatus } from "@/lib/usageTracking";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<{
    isAuthenticated: boolean;
    dailyLimit: number;
    costUsed: number;
    remainingCost: number;
    usagePercentage: number;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      const status = await getUserStatus();
      setUserStatus(status);
      setIsLoading(false);
    };

    getUser();
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 sm:px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold mb-6">Account Information</h2>
          <p className="text-lg leading-relaxed mb-6">
            Manage your account settings and view your usage
          </p>

          <div className="border-t border-muted my-8"></div>

          <h2 className="text-2xl font-bold mb-6">Email Address</h2>
          <p className="text-lg leading-relaxed mb-6">{user.email}</p>

          <div className="border-t border-muted my-8"></div>

          <h2 className="text-2xl font-bold mb-6">Daily Usage</h2>
          <div className="mb-6">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(userStatus?.usagePercentage || 0, 100)}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{userStatus?.usagePercentage || 0}% used</span>
              <span>{100 - (userStatus?.usagePercentage || 0)}% remaining</span>
            </div>
          </div>

          <div className="border-t border-muted my-8"></div>

          <h2 className="text-2xl font-bold mb-6">Account Actions</h2>
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full sm:w-auto cursor-pointer"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
