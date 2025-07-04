import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MagicLinkPage() {
  return (
    <div className="container mx-auto px-6 sm:px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          {/* Magic link icon */}
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
            Check Your Email!
          </h1>
          
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent you a magic link. Click the link in your email to 
            sign in instantly - no password required.
          </p>

          <div className="bg-muted/30 border rounded-lg p-4 mb-6 text-sm">
            <p className="font-medium mb-2">What to do next:</p>
            <ol className="text-left space-y-1 text-muted-foreground">
              <li>1. Check your email inbox</li>
              <li>2. Look for an email with your login link</li>
              <li>3. Click the magic link to sign in</li>
              <li>4. You&apos;ll be automatically signed in</li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Don&apos;t see the email? Check your spam folder or try requesting another magic link.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/login" className="block">
            <Button className="w-full cursor-pointer">
              Back to Sign In
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="outline" className="w-full cursor-pointer">
              Continue Browsing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}