/**
 * API client with automatic token expiration handling
 * Redirects to login when tokens expire
 */

export class ApiClient {
  private static async handleResponse(response: Response) {
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));

      // Check if it's a token expiration
      if (data.code === "TOKEN_EXPIRED" || data.error?.includes("expired")) {
        // Clear any cached auth state
        if (typeof window !== "undefined") {
          localStorage.removeItem("supabase.auth.token");
          // Redirect to login
          window.location.href = "/auth/login?reason=expired";
        }
        throw new Error("Session expired. Please log in again.");
      }
    }

    return response;
  }

  static async fetch(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, options);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  static async get(url: string) {
    return this.fetch(url, { method: "GET" });
  }

  static async post(url: string, data: unknown) {
    return this.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }

  static async delete(url: string) {
    return this.fetch(url, { method: "DELETE" });
  }
}
