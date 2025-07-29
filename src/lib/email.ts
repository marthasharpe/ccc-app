import sgMail from "@sendgrid/mail";

// Initialize SendGrid only if the API key is available
const getSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not configured");
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  return sgMail;
};

interface GroupCancellationEmailData {
  memberEmails: string[];
  groupType: "small" | "large";
  ownerEmail?: string;
}

export async function sendGroupCancellationEmail(
  data: GroupCancellationEmailData
) {
  try {
    if (!data.memberEmails.length) {
      console.log(
        "No member emails provided for group cancellation notification"
      );
      return;
    }

    const sendGrid = getSendGrid();
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!fromEmail) {
      throw new Error("SENDGRID_FROM_EMAIL is not configured");
    }

    const groupTypeDisplay =
      data.groupType === "small" ? "Small Group" : "Large Group";

    // Email content
    const subject = `Your Truth Me Up ${groupTypeDisplay} Plan has been cancelled`;

    const textContent = `
Hi there,

We're writing to let you know that the Truth Me Up ${groupTypeDisplay} Study Pack you were part of has been cancelled by the group owner.

If you'd like to continue with unlimited usage, you can:
• Purchase your own individual study pack
• Join another group (if you have a join code)
• Create your own group and invite others

You can manage your account and explore study packs at: https://truthmeup.com/options

If you have any questions, please don't hesitate to reach out to our support team.

Thanks for using Truth Me Up!

The Truth Me Up Team
    `.trim();

    const htmlContent = textContent
      .replace(/\n/g, "<br>")
      .replace(/• /g, "&bull; ")
      .replace(
        "https://truthmeup.com/options",
        '<a href="https://truthmeup.com/options">https://truthmeup.com/options</a>'
      );

    // Send email to each member
    const emailPromises = data.memberEmails
      .filter((email) => email && email.trim()) // Filter out empty emails
      .map((email) => {
        const msg = {
          to: email.trim(),
          from: fromEmail,
          subject,
          text: textContent,
          html: htmlContent,
        };

        return sendGrid.send(msg);
      });

    await Promise.all(emailPromises);
    console.log(
      `Successfully sent group cancellation emails to ${data.memberEmails.length} members`
    );
  } catch (error) {
    console.error("Error sending group cancellation emails:", error);

    // Log detailed SendGrid error
    if (error && typeof error === "object" && "response" in error) {
      const errorWithResponse = error as { response?: { body?: unknown } };
      console.error(
        "SendGrid error details:",
        errorWithResponse.response?.body
      );
    }

    // Don't throw - we don't want email failures to break the webhook
    // The group cleanup should still complete even if emails fail
  }
}
