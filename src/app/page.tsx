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
          Get answers to your questions about Catholic doctrine, faith, and
          morals.
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          Ask an AI assistant trained on the Catechism of the Catholic Church.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/chat">
            <Button
              size="lg"
              className="text-lg px-8 py-3 cursor-pointer w-full sm:w-48"
            >
              Ask a Question
            </Button>
          </Link>
          <Link href="/search">
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 cursor-pointer w-full sm:w-48"
            >
              Search the Catechism
            </Button>
          </Link>
        </div>

        <div className="mt-12 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-4 sm:p-6 border">
            <h3 className="font-semibold mb-3">Ask Questions</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Get clear answers about Catholic teaching, doctrine, and moral
              guidance from the Catechism
            </p>
          </div>

          <div className="p-4 sm:p-6 border">
            <h3 className="font-semibold mb-3">Accurate Responses</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Responses include specific Catechism references you can click to
              read the full paragraphs
            </p>
          </div>

          <div className="p-4 sm:p-6 border sm:col-span-2 lg:col-span-1">
            <h3 className="font-semibold mb-3">Search for Topics</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Browse and search through specific paragraphs when you need
              detailed exploration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
