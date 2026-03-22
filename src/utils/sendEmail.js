import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (toEmail, otp) => {
  await resend.emails.send({
    from: "NexBills <noreply@nexorbizs.com>",
    to: toEmail,
    subject: "Password Reset OTP — NexBills",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p style="color: #475569;">Your OTP to reset your NexBills password:</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #4f46e5;">${otp}</span>
        </div>
        <p style="color: #475569;">This OTP is valid for <strong>5 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">NexBills — powered by NexorBizs Technologies</p>
      </div>
    `
  });
};