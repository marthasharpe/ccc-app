import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="container mx-auto px-6 sm:px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4 text-destructive">
          Authentication Error
        </h1>
        <p className="text-muted-foreground mb-6">
          Sorry, something went wrong during the authentication process.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}