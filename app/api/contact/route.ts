import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { escapeHtml, sanitizeInput } from "@/lib/security";

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.contact);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required fields (Name, Email, Message)." },
        { status: 400 }
      );
    }

    // Sanitize and enforce length limits
    const name = sanitizeInput(String(body.name), 100);
    const email = sanitizeInput(String(body.email), 320);
    const message = sanitizeInput(String(body.message), 5000);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const adminEmail = process.env.CONTACT_RECEIVER_EMAIL;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!adminEmail) {
      console.error("CONTACT_RECEIVER_EMAIL not configured.");
      return NextResponse.json(
        { success: false, error: "Contact form is not configured. Please try again later." },
        { status: 500 }
      );
    }

    const dateStr = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    });

    // ESCAPE ALL USER INPUT before interpolating into HTML templates
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    // 1. HTML Template for Admin Email
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border: 1px solid #222222; border-radius: 12px; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1f1f1f; }
          .brand-title { font-size: 24px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; margin: 0; }
          .brand-red { color: #C81E1E; }
          .badge { display: inline-block; background-color: #1a1a1a; color: #ef4444; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; padding: 6px 14px; border-radius: 20px; margin-top: 14px; border: 1px solid rgba(239, 68, 68, 0.2); }
          .content { padding: 24px 0; }
          .field-group { margin-bottom: 20px; }
          .label { font-size: 10px; color: #888888; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 6px; font-weight: 600; }
          .value { font-size: 15px; color: #ffffff; line-height: 1.5; font-weight: 500; }
          .message-box { background-color: #141414; border-left: 3px solid #C81E1E; padding: 18px; border-radius: 6px; font-size: 14px; color: #e4e4e7; line-height: 1.6; whitespace: pre-wrap; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #1f1f1f; font-size: 11px; color: #666666; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <div style="background-color: #000000; padding: 20px 0;">
          <div class="container">
            <div class="header">
              <h1 class="brand-title"><span class="brand-red">GODS</span> OWN CULTURE</h1>
              <div class="badge">New Contact Inquiry</div>
            </div>
            
            <div class="content">
              <div class="field-group">
                <div class="label">Customer Name</div>
                <div class="value">${safeName}</div>
              </div>

              <div class="field-group">
                <div class="label">Customer Email</div>
                <div class="value"><a href="mailto:${safeEmail}" style="color: #ef4444; text-decoration: none;">${safeEmail}</a></div>
              </div>

              <div class="field-group">
                <div class="label">Submitted At</div>
                <div class="value" style="font-size: 12px; color: #aaaaaa;">${dateStr}</div>
              </div>

              <div class="field-group">
                <div class="label">Message Content</div>
                <div class="message-box">${safeMessage}</div>
              </div>
            </div>

            <div class="footer">
              GODS OWN CULTURE &bull; E-Commerce Concierge Notification
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. HTML Template for Customer Auto-Response
    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border: 1px solid #222222; border-radius: 12px; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1f1f1f; }
          .brand-title { font-size: 24px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; margin: 0; }
          .brand-red { color: #C81E1E; }
          .headline { font-size: 20px; font-weight: 300; text-align: center; margin: 24px 0 12px 0; color: #ffffff; tracking-tight; }
          .body-text { font-size: 14px; color: #a1a1aa; line-height: 1.7; text-align: center; margin-bottom: 28px; }
          .summary-card { background-color: #141414; border: 1px solid #262626; border-radius: 8px; padding: 20px; text-align: left; margin-bottom: 24px; }
          .summary-title { font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700; margin-bottom: 12px; }
          .summary-content { font-size: 13px; color: #d4d4d8; line-height: 1.6; whitespace: pre-wrap; font-style: italic; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; background-color: #ffffff; color: #000000; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.25em; padding: 14px 32px; border-radius: 8px; text-decoration: none; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #1f1f1f; font-size: 11px; color: #71717a; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div style="background-color: #000000; padding: 20px 0;">
          <div class="container">
            <div class="header">
              <h1 class="brand-title"><span class="brand-red">GODS</span> OWN CULTURE</h1>
            </div>
            
            <h2 class="headline">Thank you for contacting us, ${safeName}.</h2>
            
            <p class="body-text">
              We have received your message. Our Concierge Team is currently reviewing your inquiry and will respond back to you within 24 hours.
            </p>

            <div class="summary-card">
              <div class="summary-title">Summary of Your Message</div>
              <div class="summary-content">"${safeMessage}"</div>
            </div>

            <div class="btn-container">
              <a href="https://godsownculture.com" class="btn">Explore Collections</a>
            </div>

            <div class="footer">
              <p style="margin: 0 0 6px 0; color: #a1a1aa; font-weight: 600;">GODS OWN CULTURE</p>
              <p style="margin: 0;">Streetwear Born from Kerala Heritage</p>
              <p style="margin: 8px 0 0 0; color: #52525b; font-size: 10px;">If you have additional details, simply reply directly to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Send emails using Nodemailer if SMTP credentials are fully provided
    const isSmtpConfigured = Boolean(smtpHost && smtpUser && smtpPass && smtpPass.trim().length > 0);

    if (isSmtpConfigured) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Send to Admin
      await transporter.sendMail({
        from: `"${safeName} via GODS OWN" <${smtpUser}>`,
        replyTo: email, // Use raw email for reply-to (not HTML context)
        to: adminEmail,
        subject: `New Inquiry from ${safeName} — GODS OWN CULTURE`,
        html: adminHtml,
      });

      // Send Auto-Confirmation to Customer
      await transporter.sendMail({
        from: `"GODS OWN CULTURE" <${smtpUser}>`,
        to: email,
        subject: `We've Received Your Message — GODS OWN CULTURE`,
        html: customerHtml,
      });

      console.log(`[Contact API] Email successfully sent to ${adminEmail} and confirmation to ${email}`);
    } else {
      // Fallback logging when SMTP credentials are not configured yet
      console.log("==========================================");
      console.log("[Contact API] SMTP credentials not set in .env.local yet.");
      console.log(`From: ${name} <${email}>`);
      console.log(`Message: ${message}`);
      console.log("==========================================");
    }

    return NextResponse.json({
      success: true,
      liveEmailSent: isSmtpConfigured,
      message: isSmtpConfigured
        ? "Your message has been sent successfully."
        : "Your message has been received.",
    });
  } catch (error: any) {
    console.error("[Contact API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process your message. Please try again later." },
      { status: 500 }
    );
  }
}
