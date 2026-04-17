import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, subject, message } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (!fullName || !fullName.trim()) errors.fullName = "Name is required";
    if (!email || !email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email address";
    }
    if (!subject || !subject.trim()) errors.subject = "Subject is required";
    if (!message || !message.trim()) errors.message = "Message is required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    const toEmail = process.env.CONTACT_TO_EMAIL || "info@mood-gf.com";
    const sanitizedName = escapeHtml(fullName.trim());
    const sanitizedEmail = escapeHtml(email.trim());
    const sanitizedPhone = phone?.trim() ? escapeHtml(phone.trim()) : "";
    const sanitizedSubject = escapeHtml(subject.trim());
    const sanitizedMessage = escapeHtml(message.trim());

    // Plain text version (critical for avoiding spam)
    const textBody = [
      `New contact form submission from mood-gf.com`,
      ``,
      `Full Name: ${fullName.trim()}`,
      `Email: ${email.trim()}`,
      `Phone: ${sanitizedPhone || "Not provided"}`,
      `Subject: ${subject.trim()}`,
      ``,
      `Message:`,
      message.trim(),
      ``,
      `--`,
      `This message was sent from the Mood website contact form.`,
    ].join("\n");

    await transporter.sendMail({
      from: `"Mood - Contact Form" <${process.env.SMTP_USER}>`,
      to: toEmail,
      replyTo: email.trim(),
      subject: `Contact Form: ${subject.trim()}`,
      headers: {
        "X-Mailer": "Mood Website",
        "X-Priority": "3",
      },
      text: textBody,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:#15803d; padding:28px 32px;">
              <p style="margin:0; color:#ffffff; font-size:20px; font-weight:bold;">New Contact Form Submission</p>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.8); font-size:13px;">From mood-gf.com</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #eee; color:#888; font-size:13px; width:100px; vertical-align:top;">Name</td>
                  <td style="padding:10px 0; border-bottom:1px solid #eee; color:#222; font-size:14px;">${sanitizedName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #eee; color:#888; font-size:13px; vertical-align:top;">Email</td>
                  <td style="padding:10px 0; border-bottom:1px solid #eee; color:#222; font-size:14px;">${sanitizedEmail}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #eee; color:#888; font-size:13px; vertical-align:top;">Phone</td>
                  <td style="padding:10px 0; border-bottom:1px solid #eee; color:#222; font-size:14px;">${sanitizedPhone || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #eee; color:#888; font-size:13px; vertical-align:top;">Subject</td>
                  <td style="padding:10px 0; border-bottom:1px solid #eee; color:#222; font-size:14px; font-weight:bold;">${sanitizedSubject}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; color:#888; font-size:13px; vertical-align:top;">Message</td>
                  <td style="padding:10px 0; color:#222; font-size:14px; line-height:1.6; white-space:pre-wrap;">${sanitizedMessage}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa; padding:16px 32px; text-align:center; border-top:1px solid #eee;">
              <p style="margin:0; color:#999; font-size:11px;">Sent from the contact form on mood-gf.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
