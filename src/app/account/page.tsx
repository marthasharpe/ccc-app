"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { getUserStatus } from "@/lib/usageTracking";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<{
    isAuthenticated: boolean;
    dailyLimit: number;
    tokensUsed: number;
    remainingTokens: number;
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
      
      // Get usage status
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

  const usagePercentage = userStatus 
    ? Math.round((userStatus.tokensUsed / userStatus.dailyLimit) * 100)
    : 0;

  return (
    <div className="container mx-auto px-6 sm:px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Account</h1>
          <p className="text-muted-foreground">
            Manage your account settings and view your usage
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and authentication status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </label>
                  <p className="text-sm mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Account Created
                  </label>
                  <p className="text-sm mt-1">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Sign In
                  </label>
                  <p className="text-sm mt-1">
                    {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Authentication Provider
                  </label>
                  <p className="text-sm mt-1 capitalize">
                    {user.app_metadata?.provider || 'Email'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Token Usage</CardTitle>
              <CardDescription>
                Track your AI query usage and daily limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tokens Used Today
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {usagePercentage}% of daily limit
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{userStatus?.tokensUsed.toLocaleString() || 0} used</span>
                    <span>{userStatus?.dailyLimit.toLocaleString() || 0} total</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Remaining Tokens
                  </label>
                  <p className="text-sm mt-1">
                    {userStatus?.remainingTokens.toLocaleString() || 0} tokens remaining today
                  </p>
                </div>

                <div className="bg-muted/30 border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Account Benefits</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ 10,000 tokens daily (5x more than anonymous users)</li>
                    <li>✓ Usage sync across devices</li>
                    <li>✓ Persistent conversation history</li>
                    <li>✓ Access to all AI models</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account and authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  Sign Out
                </Button>
                <p className="text-xs text-muted-foreground">
                  Signing out will return you to the home page and reset to anonymous usage limits.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}