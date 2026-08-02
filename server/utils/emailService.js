const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`\n--- [EMAIL SERVICE DEBUG] ---`);
    console.log(`OTP recipient: ${to}`);
    console.log(`SMTP sender: ${process.env.SMTP_USER}`);
    console.log(`info.response: ${info.response}`);
    console.log(`info.accepted: ${info.accepted}`);
    console.log(`info.rejected: ${info.rejected}`);
    console.log(`-----------------------------\n`);
    
  } catch (error) {
    console.error('\n--- [EMAIL SERVICE ERROR] ---');
    console.error(`OTP recipient: ${to}`);
    console.error('Email Send Error:', error.message);
    console.error('-----------------------------\n');
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
