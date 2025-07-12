/**
 * Utility functions for handling post-login redirects
 */

const REDIRECT_KEY = 'auth_redirect_url';

/**
 * Store the current URL for post-login redirect
 * @param url - The URL to redirect to after login (defaults to current pathname)
 */
export function storeRedirectUrl(url?: string): void {
  if (typeof window === 'undefined') return;
  
  const redirectUrl = url || window.location.pathname;
  // Don't store auth-related pages as redirect URLs
  if (redirectUrl.startsWith('/auth/')) {
    return;
  }
  
  sessionStorage.setItem(REDIRECT_KEY, redirectUrl);
}

/**
 * Get the stored redirect URL and clear it from storage
 * @returns The stored redirect URL or '/' as default
 */
export function getAndClearRedirectUrl(): string {
  if (typeof window === 'undefined') return '/';
  
  const redirectUrl = sessionStorage.getItem(REDIRECT_KEY) || '/';
  sessionStorage.removeItem(REDIRECT_KEY);
  return redirectUrl;
}

/**
 * Create a login URL with the current page as redirect target
 * @param currentUrl - The current URL to redirect back to (defaults to current pathname)
 * @returns Login URL with redirect parameter
 */
export function createLoginUrl(currentUrl?: string): string {
  if (typeof window === 'undefined') return '/auth/login';
  
  const redirectUrl = currentUrl || window.location.pathname;
  
  // Don't create redirects for auth pages
  if (redirectUrl.startsWith('/auth/')) {
    return '/auth/login';
  }
  
  return `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`;
}

/**
 * Get redirect URL from query parameters
 * @param searchParams - URLSearchParams object from router
 * @returns The redirect URL or null if not present
 */
export function getRedirectFromQuery(searchParams: URLSearchParams): string | null {
  return searchParams.get('redirect');
}