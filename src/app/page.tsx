import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto px-6 sm:px-4 py-8 sm:py-16">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center">
          <Image
            src="/icon-transparent.svg"
            alt="interactive catechism logo"
            width={120}
            height={120}
            className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-6">
          Learn About Catholic Teaching
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8">
          Get answers about faith, morals, and spirituality according to the
          Catechism of the Catholic Church{" "}
          <a
            href="/about"
            className="inline-flex items-center text-primary hover:text-primary/80 p-1"
            title="Learn more about the Catechism"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </a>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/chat">
            <Button size="sm" className="text-lg px-8 py-3 w-full sm:w-76">
              Ask a Question
            </Button>
          </Link>
          <Link href="/search">
            <Button
              variant="outline"
              size="sm"
              className="text-lg px-8 py-3 w-full sm:w-76"
            >
              Search the Catechism
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
