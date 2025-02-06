import nodemailer from "nodemailer";
import {
  APP_URL,
  EMAIL_PASSWORD,
  EMAIL_SERVICE,
  EMAIL_USER,
} from "../config/env";

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
});

export const sendVerificationEmail = async (
  email: string,
  token: string,
  title: "verify-email" | "reset-password"
) => {
  let link = "";
  let subject = "";

  title === "verify-email"
    ? ((link = `${APP_URL}/verify-email?token=${token}`),
      (subject = "Verifikasi Email"))
    : ((link = `${APP_URL}/reset-password?token=${token}`),
      (subject = "Reset Password"));

  console.info(
    `Sending verification email to ${email}. Click this link to verify: ${link}`,
    `email user : ${EMAIL_USER} and password : ${EMAIL_PASSWORD}, with service : ${EMAIL_SERVICE}`
  );

  const templateHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <title>Konfirmasi Email</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .email-header img {
          width: 50px;
          margin-bottom: 10px;
        }
        .email-body {
          font-size: 16px;
          line-height: 1.5;
          color: #333;
        }
        .email-button {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background-color: #1a82e2;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-size: 16px;
        }
        .email-footer {
          margin-top: 20px;
          font-size: 14px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://via.placeholder.com/50" alt="MarkSeek Logo">
          <h2>Selamat Datang di MarkSeek!</h2>
        </div>
        <div class="email-body">
          <p>
          ${
            title === "verify-email"
              ? "Klik tombol di bawah ini untuk memverifikasi email kamu:"
              : "Klik tombol di bawah ini untuk mereset password kamu:"
          }
          </p>
          <a href="${link}" class="email-button">Konfirmasi Email</a>
          <p>Jika tombol tidak berfungsi, salin dan tempel link berikut ke browser kamu:</p>
          <p><a href="${link}">${link}</a></p>
        </div>
        <div class="email-footer">
          <p>Terima kasih telah bergabung dengan MarkSeek! 🚀</p>
          <p>&copy; 2024 MarkSeek. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
    `;

  await transporter.sendMail({
    from: EMAIL_USER,
    to: email,
    subject: subject,
    html: templateHtml,
  });
};
