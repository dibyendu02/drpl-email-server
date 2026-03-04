const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendContactEmail({ domain, fields, fileUrl, clientIp }) {
  const timestamp = new Date().toISOString();

  const fieldRows = Object.entries(fields)
    .map(([key, value]) => `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${escapeHtml(key)}</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(String(value))}</td></tr>`)
    .join("\n");

  const fileRow = fileUrl
    ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Attached File</td><td style="padding:8px;border:1px solid #ddd;"><a href="${escapeHtml(fileUrl)}">${escapeHtml(fileUrl)}</a></td></tr>`
    : "";

  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Source Domain:</strong> ${escapeHtml(domain)}</p>
    <p><strong>Timestamp:</strong> ${timestamp}</p>
    <p><strong>Client IP:</strong> ${escapeHtml(clientIp)}</p>
    <table style="border-collapse:collapse;width:100%;margin-top:16px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Field</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Value</th>
        </tr>
      </thead>
      <tbody>
        ${fieldRows}
        ${fileRow}
      </tbody>
    </table>
  `;

  const subject = `Contact Form — ${domain} — ${new Date().toLocaleDateString("en-US")}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject,
    html,
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { sendContactEmail };
