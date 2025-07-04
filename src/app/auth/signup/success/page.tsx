import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignUpSuccessPage() {
  return (
    <div className="container mx-auto px-6 sm:px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          {/* Email icon */}
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
                d="M3 8l7.89 4.26c.3.16.67.16.97 0L20 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
            Check Your Email!
          </h1>
          
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent you a confirmation link. Please check your email 
            and click the link to activate your account.
          </p>

          <div className="bg-muted/30 border rounded-lg p-4 mb-6 text-sm">
            <p className="font-medium mb-2">What to do next:</p>
            <ol className="text-left space-y-1 text-muted-foreground">
              <li>1. Check your email inbox</li>
              <li>2. Look for an email from us</li>
              <li>3. Click the confirmation link</li>
              <li>4. Return here to sign in</li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Don&apos;t see the email? Check your spam folder or try signing up again.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/login" className="block">
            <Button className="w-full cursor-pointer">
              Go to Sign In
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