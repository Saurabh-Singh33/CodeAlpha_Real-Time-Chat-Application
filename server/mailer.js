const nodemailer = require('nodemailer');
require('dotenv').config();

const sendMeetingInvite = async ({ toEmail, roomId, roomLink, inviterName }) => {
  const gmailUser = process.env.SMTP_USER;
  const gmailPass = process.env.SMTP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    throw new Error('SMTP credentials not configured. Please add your SMTP_USER and SMTP_PASSWORD in server/.env');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass
    }
  });

  const appName = process.env.APP_NAME || 'VartaConnect';
  const logoUrl = process.env.LOGO_URL || 'YOUR_LOGO_URL_HERE'; // Please add your logo URL to .env as LOGO_URL

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #121826; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .logo-box { width: 44px; height: 44px; display: inline-block; }
        .logo-box img { width: 100%; height: 100%; object-fit: contain; }
        .app-name { font-size: 22px; font-weight: 700; color: #ffffff; margin-left: 10px; vertical-align: middle; }
        h2 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 8px; }
        p { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
        .info-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 28px; }
        .info-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value { font-size: 16px; font-weight: 600; color: #6366f1; word-break: break-all; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; text-align: center; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4); }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="logo-box"><img src="${logoUrl}" alt="${appName} Logo" /></span>
          <span class="app-name">${appName}</span>
        </div>
        
        <h2>You've Been Invited to a Video Meeting</h2>
        <p><strong>${inviterName || 'A participant'}</strong> is inviting you to join a real-time HD video call on ${appName}.</p>
        
        <div class="info-card">
          <div style="margin-bottom: 12px;">
            <div class="info-label">Invited By</div>
            <div style="font-size: 15px; color: #f8fafc; font-weight: 600;">${inviterName || `${appName} User`}</div>
          </div>
          <div>
            <div class="info-label">Meeting Code</div>
            <div class="info-value">${roomId}</div>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${roomLink}" target="_blank" class="btn">Join Meeting Now</a>
        </div>
        
        <p style="font-size: 13px; color: #64748b;">Or copy & paste this URL into your browser:<br><a href="${roomLink}" style="color: #6366f1;">${roomLink}</a></p>
        
        <div class="footer">
          ${appName} Encrypted Video Meetings • P2P WebRTC Communication
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${appName} Meetings" <${gmailUser}>`,
    to: toEmail,
    subject: `📹 Meeting Invitation: Join ${inviterName || 'User'} on ${appName}`,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

const sendContactEmail = async ({ name, email, subject, category, message }) => {
  const gmailUser = process.env.SMTP_USER;
  const gmailPass = process.env.SMTP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    throw new Error('SMTP credentials not configured.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass
    }
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #202124; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h2 { color: #1A73E8; margin-top: 0; }
        .field { margin-bottom: 16px; }
        .label { font-size: 12px; font-weight: 600; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-size: 15px; font-weight: 500; color: #202124; margin-top: 4px; padding: 12px; background-color: #f1f3f4; border-radius: 8px; white-space: pre-wrap; }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #5f6368; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>New Contact Request</h2>
        
        <div class="field">
          <div class="label">Sender Name</div>
          <div class="value">${name}</div>
        </div>
        
        <div class="field">
          <div class="label">Sender Email</div>
          <div class="value">${email}</div>
        </div>
        
        <div class="field">
          <div class="label">Category</div>
          <div class="value">${category}</div>
        </div>
        
        <div class="field">
          <div class="label">Subject</div>
          <div class="value">${subject}</div>
        </div>
        
        <div class="field">
          <div class="label">Message</div>
          <div class="value">${message}</div>
        </div>
        
        <div class="footer">
          VartaConnect System • Automated Contact Delivery
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"VartaConnect Contact" <${gmailUser}>`,
    to: gmailUser, // send to the business inbox (using the configured SMTP user by default)
    replyTo: email,
    subject: `[${category}] ${subject} - from ${name}`,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = { sendMeetingInvite, sendContactEmail };
