"use client";

import { formatCCCLinks, hasCCCReferences } from "@/utils/cccLinkFormatter";
import { useRouter } from "next/navigation";
import sampleQuestions from "@/data/sampleQuestions.json";

interface SampleQuestion {
  id: string;
  prompt: string;
  response: string;
}

export function SampleQuestions() {
  const router = useRouter();

  const handleCCCClick = (reference: string) => {
    router.push(`/paragraph/${reference}`);
  };

  return (
    <div className="space-y-8">
      {sampleQuestions.map((question: SampleQuestion) => (
        <div key={question.id} className="space-y-6">
          <div className="border rounded-lg p-4 sm:p-6 bg-card">
            {/* Question Section */}
            <div className="mb-6">
              <div className="text-sm font-medium text-primary mb-3">
                Sample Question:
              </div>
              <div className="text-foreground leading-relaxed font-medium">
                {question.prompt}
              </div>
            </div>

            {/* Response Section */}
            <div>
              <div className="text-sm font-medium text-primary mb-3">
                Sample Response:
              </div>
              <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                {hasCCCReferences(question.response)
                  ? formatCCCLinks({
                      text: question.response,
                      onCCCClick: handleCCCClick,
                    })
                  : question.response}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
