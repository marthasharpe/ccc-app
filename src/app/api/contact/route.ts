import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid only if the API key is available
const getSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not configured");
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  return sgMail;
};

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, type } = await request.json();

    // Validate required fields
    if (!name || !email || !message || !type) {
      return NextResponse.json(
        { error: "All fields are required" },
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

    // Initialize SendGrid
    const sendGrid = getSendGrid();

    // Get recipient email from environment
    const toEmail = process.env.CONTACT_EMAIL || process.env.SENDGRID_FROM_EMAIL;
    if (!toEmail) {
      throw new Error("CONTACT_EMAIL or SENDGRID_FROM_EMAIL is not configured");
    }

    // Prepare email content
    const emailSubject = `[TruthMeUp Contact] ${type}`;
    const emailBody = `
New contact form submission from TruthMeUp:

Name: ${name}
Email: ${email}
Type: ${type}

Message:
${message}

---
Sent from TruthMeUp Contact Form
Time: ${new Date().toISOString()}
`;

    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: emailSubject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
      replyTo: email, // Allow easy reply to the sender
    };

    // Send email
    await sendGrid.send(msg);

    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending contact form:", error);
    
    // Log detailed SendGrid error
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response?: { body?: unknown } };
      console.error("SendGrid error details:", errorWithResponse.response?.body);
    }
    
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}