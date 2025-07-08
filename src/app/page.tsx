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
          Get answers about Catholic faith, morals, and spirituality.
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          Ask an AI assistant trained on the Catechism of the Catholic Church.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/chat">
            <Button
              size="sm"
              className="text-lg px-8 py-3 w-full sm:w-76"
            >
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
