import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface User {
  id: string;
  email: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name:
              session.user.user_metadata?.name ||
              session.user.user_metadata?.full_name,
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, !!session?.user);

      // Handle token expiration or sign out
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);

        // If user was previously authenticated and is now signed out unexpectedly,
        // it might be due to token expiration
        if (event === "SIGNED_OUT" && user) {
          console.warn(
            "User was signed out - possibly due to token expiration"
          );
          // Redirect to login with expiration message
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login?reason=expired";
          }
        }
        return;
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name:
            session.user.user_metadata?.name ||
            session.user.user_metadata?.full_name,
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Login error:", error);
      return { user: null, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const supabase = createClient();
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { user: null, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setIsAuthenticated(false);
      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    signUp,
  };
}
