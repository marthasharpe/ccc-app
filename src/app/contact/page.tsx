"use client";

import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const handleEmailClick = () => {
    const subject = encodeURIComponent("Truth Me Up - Contact");
    const body = encodeURIComponent(
      "Hi,\n\nI'd like to get in touch about Truth Me Up.\n\n[Please describe your question, feedback, or issue here]\n\nThanks!"
    );
    window.open(
      `mailto:marthasharpe2020+truthmeup@gmail.com?subject=${subject}&body=${body}`,
      "_blank"
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Contact Truth Me Up</h1>
          <p className="text-lg max-w-2xl mx-auto mb-8">
            Want to support this project?{" "}
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

        <div className="text-center text-lg space-y-6">
          <p className="mb-6">Have a question, feedback, or bug report?</p>
          <Button
            size="sm"
            onClick={handleEmailClick}
            className="w-full max-w-40"
          >
            Send Email
          </Button>
        </div>
      </div>
    </div>
  );
}
