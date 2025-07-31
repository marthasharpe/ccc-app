import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend only if the API key is available
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(process.env.RESEND_API_KEY);
};

export async function POST(request: NextRequest) {
  try {
    const { email, message, type } = await request.json();

    // Validate required fields
    if (!email || !message || !type) {
      return NextResponse.json(
        { error: "Email, message, and type are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Initialize Resend
    const resend = getResend();

    // Get recipient email from environment
    const toEmail =
      process.env.CONTACT_EMAIL || process.env.FROM_EMAIL;
    if (!toEmail) {
      throw new Error("CONTACT_EMAIL or FROM_EMAIL is not configured");
    }

    // Prepare email content
    const emailSubject = `Truth Me Up ${type}`;
    const emailBody = `
New contact form submission from Truth Me Up:

Email: ${email}
Type: ${type}

Message:
${message}

---
Sent from Truth Me Up Contact Form
Time: ${new Date().toISOString()}
`;

    // Validate FROM_EMAIL
    const fromEmail = process.env.FROM_EMAIL;
    if (!fromEmail) {
      throw new Error("FROM_EMAIL environment variable is not configured");
    }

    // Send email
    await resend.emails.send({
      to: toEmail,
      from: fromEmail,
      subject: emailSubject,
      text: emailBody,
      html: emailBody.replace(/\n/g, "<br>"),
      replyTo: email, // Allow easy reply to the sender
    });

    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending contact form:", error);

    // Log detailed Resend error
    if (error && typeof error === "object" && "message" in error) {
      console.error("Resend error details:", error.message);
    }

    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
