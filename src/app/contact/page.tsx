"use client";

import { Button } from "@/components/ui/button";
// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";

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

  // const [formData, setFormData] = useState({
  //   email: "",
  //   message: "",
  //   type: "Contact",
  // });
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [submitStatus, setSubmitStatus] = useState<
  //   "idle" | "success" | "error"
  // >("idle");

  // const handleInputChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  // ) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);
  //   setSubmitStatus("idle");

  //   try {
  //     const response = await fetch("/api/contact", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(formData),
  //     });

  //     if (response.ok) {
  //       setSubmitStatus("success");
  //       setFormData({ email: "", message: "", type: "Contact" });
  //     } else {
  //       setSubmitStatus("error");
  //     }
  //   } catch {
  //     setSubmitStatus("error");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

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
        {/* 
        <div className="space-y-6">
          <p className="text-center text-lg mb-6">
            Have a question, feedback, or bug report?
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-2"
              >
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                placeholder="Write your message here..."
                rows={6}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>

          {submitStatus === "success" && (
            <div className="text-center text-green-600 font-medium">
              Message sent successfully! We&apos;ll get back to you soon.
            </div>
          )}

          {submitStatus === "error" && (
            <div className="text-center text-red-600 font-medium">
              Failed to send message. Please try again later.
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
}
