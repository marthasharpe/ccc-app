"use client";

interface ChatInstructionsProps {
  onExampleClick?: (question: string) => void;
}

export function ChatInstructions({ onExampleClick }: ChatInstructionsProps) {
  const examples = [
    "What does the Catholic Church teach about conscience?",
    "Explain the sacrament of reconciliation",
    "What is the Catholic understanding of free will?",
    "How does the Church define mortal sin?",
  ];

  return (
    <div className="space-y-6 mt-8">
      {/* Instructions Section */}
      {/* <div className="bg-muted/50 rounded-lg p-6 border border-muted">
        <div className="flex items-start gap-3 mb-4">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              How to get better answers:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Be specific:</span>{" "}
                Ask about particular doctrines, practices, or teachings
              </li>
              <li>
                <span className="font-medium text-foreground">Use clear language:</span>{" "}
                Avoid jargon unless asking about technical theological terms
              </li>
              <li>
                <span className="font-medium text-foreground">Ask one thing at a time:</span>{" "}
                Focus questions help get more accurate Catholic teaching
              </li>
              <li>
                <span className="font-medium text-foreground">Check CCC references:</span>{" "}
                Click on paragraph numbers to read the official source
              </li>
            </ul>
          </div>
        </div>
      </div> */}

      {/* Example Questions Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-primary">Example questions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => onExampleClick?.(example)}
              className="text-left p-3 rounded-lg border border-muted hover:border-primary hover:bg-muted transition-colors group cursor-pointer"
            >
              <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                {example}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
