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

        <div className="border-t border-muted my-12"></div>

        <div className="space-y-6">
          <h2 id="interactive-catechism" className="text-2xl font-bold mb-6">
            Why Truth Me Up?
          </h2>
          <div className="text-left">
            <p className="text-lg leading-relaxed mb-6">
              It&apos;s not always easy to find out what the Catholic Church
              actually teaches. The Catechism is a reliable source, but it can
              be hard to navigate or apply to real-life questions. Asking other
              Catholics can be even more confusing, as their answers may include
              personal opinions or ideals rather than official Church teaching.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              <strong>Truth Me Up</strong> uses advanced AI (GPT-4.0) to make
              Church teaching more accessible. It gives clear, trustworthy
              answers drawn only from official sources—the Catechism and other
              approved magisterial documents—with direct links for deeper study.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              By combining the authority of Church teaching with the
              accessibility of modern technology, <strong>Truth Me Up</strong>{" "}
              is helping the Church&apos;s mission of spreading the Gospel in a
              digital world:
            </p>
            <p className="text-lg leading-relaxed mb-6 border-l-4 border-primary pl-6">
              <em>
                The Church must learn to cope with and benefit from the marvels
                of technology in order to proclaim the Gospel to all.
              </em>{" "}
              — Pope John Paul II, Message for the 36th World Communications Day
              (2002)
            </p>
          </div>

          <div className="border-t border-muted my-12"></div>

          <p className="text-lg leading-relaxed">
            Want to support <strong>Truth Me Up</strong>?{" "}
            <a
              href="https://coff.ee/marthasharpe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all cursor-pointer text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Donate to the developer
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
