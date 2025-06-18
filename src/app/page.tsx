import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to MyCat
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Search the Catechism of the Catholic Church with ease. 
          Find answers to your questions about faith, morals, and Catholic teaching.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/search">
            <Button size="lg">
              Start Searching
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-3">Comprehensive Search</h3>
            <p className="text-sm text-muted-foreground">
              Search through all paragraphs of the Catechism using semantic search technology
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-3">Relevant Results</h3>
            <p className="text-sm text-muted-foreground">
              Find the most relevant passages based on meaning, not just keywords
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-3">Easy Navigation</h3>
            <p className="text-sm text-muted-foreground">
              Results include paragraph numbers for easy reference to your physical Catechism
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
