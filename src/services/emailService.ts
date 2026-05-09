import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const config = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (config.host && config.auth.user) {
      transporter = nodemailer.createTransport(config);
    } else {
      console.warn('SMTP configuration missing. Emails will be logged to console instead.');
    }
  }
  return transporter;
}

export async function sendOTPEmail(email: string, otp: string, orgName: string) {
  const client = getTransporter();
  
  const subject = `Welcome to VMS Pro - Your Temporary Password for ${orgName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
      <h1 style="color: #4f46e5;">Welcome to VMS Pro</h1>
      <p>Hello,</p>
      <p>You have been added as an administrator for <strong>${orgName}</strong>.</p>
      <p>Please use the following one-time password to log in to your account:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <code style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4f46e5;">${otp}</code>
      </div>
      <p>Upon logging in, you will be prompted to set a new permanent password.</p>
      <p>If you did not expect this email, please contact the VMS Pro support team.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">&copy; 2026 VMS Pro. All rights reserved.</p>
    </div>
  `;

  if (client) {
    try {
      await client.sendMail({
        from: process.env.SMTP_FROM || 'noreply@vmspro.com',
        to: email,
        subject,
        html,
      });
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  } else {
    console.log('--- MOCK EMAIL START ---');
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`OTP: ${otp}`);
    console.log('--- MOCK EMAIL END ---');
  }
}
