import { useState } from "react";
import { ApiClient } from "@/lib/api-client";

/**
 * Hook for making API calls with automatic token expiration handling
 */
export function useApiCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = async <T>(
    apiCall: () => Promise<Response>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "API call failed");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("API call failed:", errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const get = async <T>(url: string): Promise<T | null> => {
    return callApi<T>(() => ApiClient.get(url));
  };

  const post = async <T>(url: string, data: unknown): Promise<T | null> => {
    return callApi<T>(() => ApiClient.post(url, data));
  };

  const del = async <T>(url: string): Promise<T | null> => {
    return callApi<T>(() => ApiClient.delete(url));
  };

  return {
    isLoading,
    error,
    get,
    post,
    delete: del,
    callApi,
  };
}
