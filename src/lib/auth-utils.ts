import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Handles auth token expiration and refresh for API routes
 * Returns user if authenticated, null if not, throws error if token expired
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      // Check if it's a token expiration error
      if (
        authError.message?.includes("JWT") ||
        authError.message?.includes("expired")
      ) {
        throw new TokenExpiredError("Authentication token has expired");
      }
      throw authError;
    }

    return user;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw error;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 * Handles token expiration gracefully with proper error responses
 */
export function withAuth<T extends unknown[]>(
  handler: (user: unknown, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUser();

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      return await handler(user, ...args);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return NextResponse.json(
          { error: "Token expired", code: "TOKEN_EXPIRED" },
          { status: 401 }
        );
      }

      console.error("Authentication error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredError";
  }
}
