const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendWelcomeEmail = async (email, username) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Welcome to LaptopStore",
    html: `
      <h2>Welcome, ${username}</h2>
      <p>Thank you for registering at LaptopStore.</p>
      <p>We’re glad to have you!</p>
    `
  });
};
